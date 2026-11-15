/**
 * Avatar3DScene.tsx
 * React Three Fiber 3D Canvas Scene for Chromatique.
 * Renders the realistic 3D female digital human with procedural PBR skin,
 * multi-zone continuous hair shader, studio lighting, and smooth camera controls.
 */

"use client";

import React, { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  AvatarView,
  AvatarSkinConfig,
  RenderedHairPalette,
  HairZoneId,
  LightingPreset,
  RenderedZoneColor,
} from "./AvatarTypes";
import { ProceduralHead3D } from "./ProceduralHead3D";
import { ProceduralHair3D } from "./ProceduralHair3D";

interface Avatar3DSceneProps {
  view: AvatarView;
  skin: AvatarSkinConfig;
  palette: RenderedHairPalette;
  rootsColor: RenderedZoneColor;
  activeZone: HairZoneId;
  lighting: LightingPreset;
  onSelectZone: (zone: HairZoneId) => void;
  className?: string;
}

// Camera and View Controller to smoothly animate between Front and Back views
function ViewController({ view }: { view: AvatarView }) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    if (!controlsRef.current) return;
    if (view === "front") {
      controlsRef.current.setAzimuthalAngle(0);
      controlsRef.current.setPolarAngle(Math.PI / 2);
    } else {
      controlsRef.current.setAzimuthalAngle(Math.PI);
      controlsRef.current.setPolarAngle(Math.PI / 2);
    }
  }, [view]);

  useFrame(() => {
    controlsRef.current?.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      minDistance={2.4}
      maxDistance={5.2}
      minPolarAngle={Math.PI / 3}
      maxPolarAngle={Math.PI / 1.7}
      target={[0, -0.15, 0]}
    />
  );
}

// Studio Lighting Rig for Three.js
function StudioLightingRig({ lighting }: { lighting: LightingPreset }) {
  if (lighting === "sunlight") {
    return (
      <>
        {/* Direct Sunlight 6500K */}
        <ambientLight intensity={0.8} color="#fffbeb" />
        <directionalLight
          position={[2.5, 4.0, 3.5]}
          intensity={2.2}
          color="#fff8db"
          castShadow
        />
        <directionalLight
          position={[-2.5, 1.5, 2.0]}
          intensity={0.7}
          color="#e0f2fe"
        />
        <directionalLight
          position={[0, 3.5, -4.0]}
          intensity={1.8}
          color="#ffedd5"
        />
      </>
    );
  }

  if (lighting === "cool") {
    return (
      <>
        {/* Cool Indoor 4000K */}
        <ambientLight intensity={0.9} color="#e0e7ff" />
        <directionalLight
          position={[2.0, 3.5, 3.5]}
          intensity={1.5}
          color="#eef2ff"
        />
        <directionalLight
          position={[-2.5, 1.5, 2.0]}
          intensity={0.9}
          color="#c7d2fe"
        />
        <directionalLight
          position={[0, 3.5, -3.8]}
          intensity={1.3}
          color="#e0e7ff"
        />
      </>
    );
  }

  // Inside Salon (3000K Balanced Professional High-CRI 3-Point Lighting)
  return (
    <>
      <ambientLight intensity={0.75} color="#fef3c7" />
      {/* Key Light */}
      <directionalLight
        position={[2.2, 3.2, 3.5]}
        intensity={1.6}
        color="#fffbeb"
      />
      {/* Fill Light */}
      <directionalLight
        position={[-2.2, 1.2, 2.5]}
        intensity={0.75}
        color="#f1f5f9"
      />
      {/* Rim / Back Hair Separation Light */}
      <directionalLight
        position={[0, 3.2, -3.6]}
        intensity={1.6}
        color="#fef3c7"
      />
    </>
  );
}

export const Avatar3DScene: React.FC<Avatar3DSceneProps> = ({
  view,
  skin,
  palette,
  rootsColor,
  activeZone,
  lighting,
  onSelectZone,
  className = "",
}) => {
  return (
    <div className={`relative w-full h-full select-none ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        className="w-full h-full"
      >
        {/* Studio Lighting */}
        <StudioLightingRig lighting={lighting} />

        {/* View Camera Controller */}
        <ViewController view={view} />

        {/* 3D Digital Human Head, Neck & Cape */}
        <ProceduralHead3D skin={skin} rootsColor={rootsColor} view={view} />

        {/* Procedural 3D Hair Strands, Volume & Shader */}
        <ProceduralHair3D
          palette={palette}
          activeZone={activeZone}
          lighting={lighting}
        />
      </Canvas>

      {/* Floating Interactive 3-Zone Touch Indicators Overlay */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={() => onSelectZone("roots")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shadow-md backdrop-blur-md border ${
            activeZone === "roots"
              ? "bg-amber-500 text-neutral-950 border-amber-400 ring-2 ring-amber-400/50 scale-105"
              : "bg-neutral-900/80 text-white border-white/20 hover:bg-neutral-800"
          }`}
          title="Select Zone 1: Roots"
        >
          <span
            className="w-2.5 h-2.5 rounded-full ring-1 ring-white/40"
            style={{ backgroundColor: palette.roots.base }}
          />
          <span>1. Roots</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectZone("midLengths")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shadow-md backdrop-blur-md border ${
            activeZone === "midLengths"
              ? "bg-amber-500 text-neutral-950 border-amber-400 ring-2 ring-amber-400/50 scale-105"
              : "bg-neutral-900/80 text-white border-white/20 hover:bg-neutral-800"
          }`}
          title="Select Zone 2: Mid-Lengths"
        >
          <span
            className="w-2.5 h-2.5 rounded-full ring-1 ring-white/40"
            style={{ backgroundColor: palette.midLengths.base }}
          />
          <span>2. Middle</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectZone("ends")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shadow-md backdrop-blur-md border ${
            activeZone === "ends"
              ? "bg-amber-500 text-neutral-950 border-amber-400 ring-2 ring-amber-400/50 scale-105"
              : "bg-neutral-900/80 text-white border-white/20 hover:bg-neutral-800"
          }`}
          title="Select Zone 3: Ends"
        >
          <span
            className="w-2.5 h-2.5 rounded-full ring-1 ring-white/40"
            style={{ backgroundColor: palette.ends.base }}
          />
          <span>3. Ends</span>
        </button>
      </div>

      {/* Orbit Tip Badge */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-[9px] text-neutral-400 pointer-events-none">
        <span>🔄</span>
        <span>Drag to rotate • Scroll to zoom</span>
      </div>
    </div>
  );
};
