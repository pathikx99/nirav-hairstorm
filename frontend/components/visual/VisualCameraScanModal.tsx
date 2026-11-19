"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { HairRegionInput } from "../../types/assessment";
import { useApp } from "../../context/AppContext";
import {
  segmentHairFromImageData,
  analyzeHairFromImageData,
  ClientHairPhotoAnalysis,
} from "../../services/clientHairPhotoService";

interface VisualCameraScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (
    roots: Partial<HairRegionInput>,
    midLengths: Partial<HairRegionInput>,
    ends: Partial<HairRegionInput>
  ) => void;
}

export function VisualCameraScanModal({
  isOpen,
  onClose,
  onApply,
}: VisualCameraScanModalProps) {
  const context = useApp();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<ClientHairPhotoAnalysis | null>(null);

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Start live webcam / phone camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser environment.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to access camera.";
      setCameraError(msg);
      setCameraActive(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Auto-start camera when modal opens
      startCamera();
    } else {
      stopCamera();
      setCapturedPhoto(null);
      setAnalysisResult(null);
      setCameraError(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Analyze an image (from video capture or file upload)
  const processImage = (img: HTMLImageElement) => {
    setIsAnalyzing(true);
    try {
      const canvas = document.createElement("canvas");
      const maxDim = 800;
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setCapturedPhoto(dataUrl);

      const imgData = ctx.getImageData(0, 0, w, h);
      const { hairMask, hairBounds } = segmentHairFromImageData(imgData);
      const analysis = analyzeHairFromImageData(imgData, hairMask, hairBounds);

      setAnalysisResult(analysis);
      context.setClientPhoto(dataUrl, true);
      context.setClientHairAnalysis(analysis);
    } catch (err) {
      console.error("Hair analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Capture snapshot from live video
  const handleCaptureSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    stopCamera();

    const img = new Image();
    img.src = canvas.toDataURL("image/jpeg", 0.95);
    img.onload = () => processImage(img);
  };

  // Upload Photo File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopCamera();
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => processImage(img);
    };
    reader.readAsDataURL(file);
  };

  // Select a sample client photo
  const handleSelectSample = (samplePath: string) => {
    stopCamera();
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = samplePath;
    img.onload = () => {
      processImage(img);
      context.setClientPhoto(samplePath, false);
    };
  };

  const handleConfirm = () => {
    if (!analysisResult) return;

    onApply(
      {
        observed_level: analysisResult.roots.level,
        observed_undertone: analysisResult.roots.tone,
        grey_percentage: analysisResult.roots.greyPercentage ?? 0,
        colourist_confirmed: true,
      },
      {
        observed_level: analysisResult.midLengths.level,
        observed_undertone: analysisResult.midLengths.tone,
        colourist_confirmed: true,
      },
      {
        observed_level: analysisResult.ends.level,
        observed_undertone: analysisResult.ends.tone,
        colourist_confirmed: true,
      }
    );

    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
    >
      <div className="relative w-full max-w-xl rounded-3xl border border-neutral-700 bg-neutral-900 p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-xl border border-amber-500/30">
              📸
            </span>
            <div>
              <h3 className="text-lg font-black text-white">Customer Hair Photo & Scanner</h3>
              <p className="text-xs text-amber-300">Live camera capture & exact pixel hair analysis</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="h-8 w-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        {/* Viewport / Viewfinder Window */}
        <div className="relative h-72 sm:h-80 w-full rounded-2xl overflow-hidden border-2 border-dashed border-amber-500/60 bg-neutral-950 flex flex-col items-center justify-center shadow-inner">
          {/* Live Video Stream */}
          {cameraActive && !capturedPhoto && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Hair & Face Guide Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-48 h-64 border-2 border-dashed border-amber-400/80 rounded-full flex flex-col items-center justify-between p-3 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  <span className="text-[10px] font-mono font-black text-amber-300 bg-black/60 px-2 py-0.5 rounded">
                    ALIGN ROOTS HERE
                  </span>
                  <span className="text-[10px] font-mono font-black text-amber-300 bg-black/60 px-2 py-0.5 rounded">
                    FACE / CHIN
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Captured / Uploaded Photo Preview */}
          {capturedPhoto && (
            <img
              src={capturedPhoto}
              alt="Client Hair Capture"
              className="absolute inset-0 w-full h-full object-contain bg-black"
            />
          )}

          {/* Analyzing Spinner */}
          {isAnalyzing && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs space-y-2">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
              <p className="text-xs font-black text-amber-300">
                Measuring Hair Levels & Pigment Reflect...
              </p>
            </div>
          )}

          {/* Camera Error / Standby Screen */}
          {!cameraActive && !capturedPhoto && (
            <div className="z-10 text-center space-y-3 p-4">
              <span className="text-4xl block">📷</span>
              <p className="text-sm font-bold text-white">
                {cameraError ? "Camera Access Blocked" : "Live Camera Standby"}
              </p>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                {cameraError
                  ? "You can upload a customer photo or choose a salon client preset below."
                  : "Allow camera permission to capture customer hair live."}
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-black text-neutral-950"
                >
                  Retry Camera
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white border border-neutral-700"
                >
                  Upload Photo
                </button>
              </div>
            </div>
          )}

          {/* Corner Crosshairs */}
          <div className="absolute top-3 left-3 h-5 w-5 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
          <div className="absolute top-3 right-3 h-5 w-5 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
          <div className="absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-amber-400 pointer-events-none" />
          <div className="absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-amber-400 pointer-events-none" />
        </div>

        {/* Live Measured Levels Display */}
        {analysisResult && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <span>✨</span> Exact Measured Hair Levels:
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                ✓ Pixel Colorimetry Confirmed
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-2">
                <span className="block text-[9px] text-neutral-400 uppercase font-black">Zone 1 Roots</span>
                <span className="text-sm font-black text-amber-400">Level {analysisResult.roots.level}</span>
                <span className="block text-[10px] text-neutral-300 font-bold">{analysisResult.roots.tone}</span>
                {analysisResult.roots.greyPercentage !== undefined && analysisResult.roots.greyPercentage > 0 && (
                  <span className="block text-[9px] text-slate-300 font-mono">
                    {analysisResult.roots.greyPercentage}% Grey
                  </span>
                )}
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-2">
                <span className="block text-[9px] text-neutral-400 uppercase font-black">Zone 2 Mid</span>
                <span className="text-sm font-black text-amber-400">Level {analysisResult.midLengths.level}</span>
                <span className="block text-[10px] text-neutral-300 font-bold">{analysisResult.midLengths.tone}</span>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-2">
                <span className="block text-[9px] text-neutral-400 uppercase font-black">Zone 3 Ends</span>
                <span className="text-sm font-black text-amber-400">Level {analysisResult.ends.level}</span>
                <span className="block text-[10px] text-neutral-300 font-bold">{analysisResult.ends.tone}</span>
              </div>
            </div>
          </div>
        )}

        {/* 1-Tap Real Salon Client Presets */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Or Test With Salon Client Photos:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSelectSample("/avatar/avatar_front_model.jpg")}
              className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-400 text-left flex items-center gap-2.5 transition-all"
            >
              <img
                src="/avatar/avatar_front_model.jpg"
                alt="Client Front"
                className="w-9 h-9 rounded-lg object-cover border border-white/20"
              />
              <div className="truncate">
                <span className="text-xs font-black text-white block truncate">Client Front View</span>
                <span className="text-[10px] text-amber-400 font-mono">Level 4 Medium Brown</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectSample("/avatar/avatar_back_model.jpg")}
              className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-400 text-left flex items-center gap-2.5 transition-all"
            >
              <img
                src="/avatar/avatar_back_model.jpg"
                alt="Client Back"
                className="w-9 h-9 rounded-lg object-cover border border-white/20"
              />
              <div className="truncate">
                <span className="text-xs font-black text-white block truncate">Client Back Mane</span>
                <span className="text-[10px] text-amber-400 font-mono">Long Wavy Strands</span>
              </div>
            </button>
          </div>
        </div>

        {/* Controls / Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-neutral-800">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {cameraActive && !capturedPhoto ? (
            <button
              type="button"
              onClick={handleCaptureSnapshot}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>📸</span> CAPTURE CUSTOMER PHOTO
            </button>
          ) : capturedPhoto && analysisResult ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setCapturedPhoto(null);
                  setAnalysisResult(null);
                  startCamera();
                }}
                className="py-3 px-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs"
              >
                Retake Photo
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>✓</span> USE THIS CLIENT PHOTO & LEVELS
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>📁</span> UPLOAD CUSTOMER PHOTO
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
