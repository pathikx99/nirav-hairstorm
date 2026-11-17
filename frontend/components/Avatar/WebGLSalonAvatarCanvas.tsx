"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { AvatarView, LightingPreset, SkinTonePreset } from "./AvatarTypes";
import {
  hexToOklab,
  getLightingHalfVector,
  getLightingEnvironmentParams,
  getBiophysicalSkinProfile,
  MODEL_BASE_SKIN_OKLAB,
} from "./AvatarColorEngine";
import { getAvatarAssetUrl, loadAvatarImage } from "../../services/avatarAssetService";
import { avatarTelemetry } from "../../services/telemetryService";

export interface WebGLSalonAvatarCanvasProps {
  rootsColor: string;
  midColor: string;
  endsColor: string;
  rootsLevel?: number;
  midLevel?: number;
  endsLevel?: number;
  rootsGrey?: number;
  midGrey?: number;
  endsGrey?: number;
  blendIntensity?: number;
  separateZones?: boolean;
  view?: AvatarView;
  skinTone?: SkinTonePreset;
  lighting?: LightingPreset;
  onFallback?: (reason: string) => void;
  onTelemetry?: (durationMs: number, fps: number) => void;
  className?: string;
}

// GLSL 3.00 ES Vertex Shader
const VS_SOURCE = `#version 300 es
in vec2 aPosition;
out vec2 vUv;

void main() {
  // Map [-1, 1] quad to [0, 1] texture coordinates
  vUv = aPosition * 0.5 + 0.5;
  // Flip Y coordinate so image is not upside down
  vUv.y = 1.0 - vUv.y;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// GLSL 3.00 ES Fragment Shader for Phase P4 Photorealistic Hair Reflectance
const FS_SOURCE = `#version 300 es
precision highp float;
precision highp int;

in vec2 vUv;
out vec4 fragColor;

// Texture Samplers
uniform sampler2D uBaseTexture;        // Master original photograph
uniform sampler2D uCleanBgTexture;     // Inpainted clean background plate
uniform sampler2D uAlphaTexture;       // Remediated hair alpha matte (Luminance)
uniform sampler2D uZoneTexture;        // 3-zone map (R=roots, G=mid, B=ends)
uniform sampler2D uFlowTexture;        // Tangent flow map (R=tx, G=ty, B=coherence)
uniform sampler2D uGreyStrandsTexture; // Continuous grey streamline fibers
uniform sampler2D uSkinTexture;        // Facial & body dermis matte (Front view only)
uniform sampler2D uFeaturesProtectTexture; // Facial features exclusion matte (eyes, lips, teeth, nostrils)

// Uniforms - Hair Dye Targets (in OKLab)
uniform vec3 uRootsOklab;
uniform vec3 uMidOklab;
uniform vec3 uEndsOklab;
uniform vec3 uLevels;                  // (rootsLvl, midLvl, endsLvl)
uniform vec3 uGreys;                   // (rootsGrey, midGrey, endsGrey) in [0, 1]
uniform float uSeparateZones;          // 1.0 = separate, 0.0 = uniform
uniform float uBlendPower;             // Zone transition exponent

// Uniforms - Studio Lighting & Reflectance
uniform vec2 uLightHalfVector;         // Projected 2D half-vector
uniform vec3 uMeanHair;                // (meanL, meanA, meanB) for brunette texture retention
uniform vec3 uLightingFilter;          // Environment illuminant chromatic adaptation (R, G, B)
uniform vec3 uSheenTintOklab;          // Specular sheen color tint in OKLab (L, a, b)
uniform float uSpecularStrength;       // Specular luster strength multiplier

// Uniforms - Biophysical Dermal Melanin & Fresnel Sheen
uniform float uApplySkinRecolor;
uniform vec3 uSkinTargetOklab;
uniform vec3 uSkinTargetLipOklab;
uniform vec3 uSkinTargetIrisOklab;
uniform vec3 uSkinBaseOklab;
uniform vec2 uSkinParams;              // (gamma, specLuster)

// --- Color Space Conversion Helpers ---

vec3 srgbToLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}

vec3 linearToSrgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(max(vec3(0.0), c), vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}

vec3 linearRgbToOklab(vec3 c) {
  float l = pow(max(0.0, 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b), 1.0 / 3.0);
  float m = pow(max(0.0, 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b), 1.0 / 3.0);
  float s = pow(max(0.0, 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b), 1.0 / 3.0);

  return vec3(
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
  );
}

vec3 oklabToLinearRgb(vec3 lab) {
  float l_ = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  float m_ = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  float s_ = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;

  float l = l_ * l_ * l_;
  float m = m_ * m_ * m_;
  float s = s_ * s_ * s_;

  return clamp(vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  ), 0.0, 1.0);
}

// Biophysical Dermal Melanin & Fresnel Sheen Shading
vec3 computeBiophysicalSkin(vec3 origRgb) {
  vec3 origLin = srgbToLinear(origRgb);
  vec3 origOklab = linearRgbToOklab(origLin);

  float k = max(0.01, origOklab.x / uSkinBaseOklab.x);
  float skinL = clamp(uSkinTargetOklab.x * pow(k, uSkinParams.x), 0.03, 0.98);

  // Epidermal lipid Fresnel highlight retention (forehead, nose bridge, cheekbone glints)
  if (origOklab.x > 0.70 && uSkinParams.y > 0.0) {
    float spec = clamp((origOklab.x - 0.70) / 0.30, 0.0, 1.0) * uSkinParams.y;
    skinL = min(0.98, skinL + spec * 0.08);
  }

  // Melanin/hemoglobin chromaticity transfer with 88% micro-vascular retention
  float skinA = uSkinTargetOklab.y + (origOklab.y - uSkinBaseOklab.y) * 0.88;
  float skinB = uSkinTargetOklab.z + (origOklab.z - uSkinBaseOklab.z) * 0.88;

  vec3 skinLin = oklabToLinearRgb(vec3(skinL, skinA, skinB));
  return clamp(linearToSrgb(skinLin), 0.0, 1.0);
}

// Biophysical Lip Melanin & Chromaticity Shading
vec3 computeBiophysicalLip(vec3 origRgb) {
  vec3 origLin = srgbToLinear(origRgb);
  vec3 origOklab = linearRgbToOklab(origLin);

  float k = max(0.01, origOklab.x / 0.6608);
  float lipL = clamp(uSkinTargetLipOklab.x * pow(k, 0.95), 0.05, 0.95);
  float lipA = uSkinTargetLipOklab.y + (origOklab.y - 0.0701) * 0.70;
  float lipB = uSkinTargetLipOklab.z + (origOklab.z - 0.0305) * 0.70;

  vec3 lipLin = oklabToLinearRgb(vec3(lipL, lipA, lipB));
  return clamp(linearToSrgb(lipLin), 0.0, 1.0);
}

// Biophysical Iris Melanin & Tone Shading
vec3 computeBiophysicalIris(vec3 origRgb) {
  vec3 origLin = srgbToLinear(origRgb);
  vec3 origOklab = linearRgbToOklab(origLin);

  float k = max(0.01, origOklab.x / 0.4241);
  float irisL = clamp(uSkinTargetIrisOklab.x * pow(k, 0.90), 0.05, 0.95);
  float irisA = uSkinTargetIrisOklab.y + (origOklab.y - 0.0262) * 0.60;
  float irisB = uSkinTargetIrisOklab.z + (origOklab.z - 0.0269) * 0.60;

  vec3 irisLin = oklabToLinearRgb(vec3(irisL, irisA, irisB));
  return clamp(linearToSrgb(irisLin), 0.0, 1.0);
}

void main() {
  vec4 baseSample = texture(uBaseTexture, vUv);
  vec3 origRgb = baseSample.rgb;
  float maskVal = texture(uAlphaTexture, vUv).r;

  // 1. Outside Hair Mask (< 2/255)
  if (maskVal <= 0.008) {
    vec3 sceneRgb = origRgb;
    if (uApplySkinRecolor > 0.5) {
      float sAlpha = texture(uSkinTexture, vUv).r;
      float pAlpha = texture(uFeaturesProtectTexture, vUv).r;

      // Lip zone check (vermilion border & core lips)
      bool isLipBox = vUv.y >= 0.354 && vUv.y <= 0.417 && vUv.x >= 0.446 && vUv.x <= 0.564;
      float lipAlpha = isLipBox ? pAlpha : 0.0;

      // Anatomical Eyeball Aperture
      vec2 uvPixel = vUv * vec2(896.0, 1200.0);
      float dl = pow((uvPixel.x - 397.0) / 21.0, 2.0) + pow((uvPixel.y - 350.0) / 8.0, 2.0);
      float dr = pow((uvPixel.x - 510.0) / 21.0, 2.0) + pow((uvPixel.y - 349.0) / 8.0, 2.0);
      bool inEyeAperture = (dl <= 1.0 || dr <= 1.0);

      vec3 lin = srgbToLinear(origRgb);
      vec3 ok = linearRgbToOklab(lin);
      float chroma = length(ok.yz);
      bool isSclera = inEyeAperture && (ok.x >= 0.46) && (chroma < 0.038);
      bool isIris = inEyeAperture && !isSclera;

      float effSkinAlpha = (isSclera || isIris) ? 0.0 : sAlpha;

      if (effSkinAlpha > 0.005) {
        vec3 skRgb = computeBiophysicalSkin(origRgb);
        skRgb = clamp(skRgb * uLightingFilter, 0.0, 1.0);
        sceneRgb = mix(sceneRgb, skRgb, effSkinAlpha);
      }

      // Feature adaptation for lips & irises OVER recolored skin
      if (lipAlpha > 0.02) {
        vec3 lipRgb = computeBiophysicalLip(origRgb);
        lipRgb = clamp(lipRgb * uLightingFilter, 0.0, 1.0);
        sceneRgb = mix(sceneRgb, lipRgb, lipAlpha);
      } else if (isIris) {
        vec3 irisRgb = computeBiophysicalIris(origRgb);
        irisRgb = clamp(irisRgb * uLightingFilter, 0.0, 1.0);
        sceneRgb = mix(sceneRgb, irisRgb, 0.85);
      }
    }
    // Background, clothes, and non-skin pixels remain 100% untouched original photo
    fragColor = vec4(sceneRgb, 1.0);
    return;
  }

  // 2. Zone Weights (R=Roots, G=Mid, B=Ends)
  vec3 zoneSample = texture(uZoneTexture, vUv).rgb;
  vec3 weights;
  if (uSeparateZones < 0.5) {
    weights = vec3(1.0, 0.0, 0.0);
  } else {
    weights = pow(zoneSample, vec3(uBlendPower));
    float sumW = weights.r + weights.g + weights.b;
    weights = sumW > 0.001 ? weights / sumW : vec3(1.0, 0.0, 0.0);
  }

  // Target Color Blending
  vec3 targetOklab = weights.r * uRootsOklab + weights.g * uMidOklab + weights.b * uEndsOklab;
  float effLevel = dot(weights, uLevels);
  float effGrey = clamp(dot(weights, uGreys), 0.0, 1.0);

  // 3. Melanin Undercoat Lift
  float normLvl = clamp(effLevel, 1.0, 10.0);
  float undercoatA = 0.015 + 0.055 * sin(3.14159265 * clamp((normLvl - 1.0) / 9.0, 0.0, 1.0));
  float undercoatB = 0.015 + 0.110 * clamp((normLvl - 2.0) / 7.0, 0.0, 1.0);

  float dyeBlend = 0.88;
  float finalDyeA = mix(undercoatA, targetOklab.y, dyeBlend);
  float finalDyeB = mix(undercoatB, targetOklab.z, dyeBlend);

  // Original photo micro-chromatic texture retention (15%)
  vec3 origLin = srgbToLinear(origRgb);
  vec3 origOklab = linearRgbToOklab(origLin);
  float microA = (origOklab.y - uMeanHair.y) * 0.15;
  float microB = (origOklab.z - uMeanHair.z) * 0.15;

  float outA = finalDyeA + microA;
  float outB = finalDyeB + microB;

  // Optical lightness transfer with dynamic contrast expansion
  float k = max(0.04, origOklab.x / uMeanHair.x);
  float gammaLevel = 1.02 - 0.024 * (normLvl - 1.0);
  float floorL = 0.040 + 0.020 * (normLvl - 1.0);
  float ceilL = min(0.98, targetOklab.x + 0.18 + 0.015 * normLvl);

  float outL = targetOklab.x * pow(k, gammaLevel);
  outL = clamp(outL, floorL, ceilL);

  // 4. Marschner Dual-Lobe Cuticle Anisotropic Reflectance
  vec3 flowSample = texture(uFlowTexture, vUv).rgb;
  float tx = flowSample.r * 2.0 - 1.0;
  float ty = flowSample.g;
  float coherence = flowSample.b;

  float t_dot_h = tx * uLightHalfVector.x + ty * uLightHalfVector.y;
  float sin_th = clamp(t_dot_h, -1.0, 1.0);
  float cos_th = sqrt(max(0.0, 1.0 - sin_th * sin_th));

  // Primary R-lobe (Cuticle tilt alpha_R = -3 deg = -0.052 rad)
  float cos_R = max(0.0, cos_th * 0.99864 + sin_th * 0.05198);
  float specR = pow(cos_R, 28.0) * coherence;

  // Secondary TRT-lobe (Cuticle tilt alpha_TRT = +5 deg = +0.087 rad)
  float cos_TRT = max(0.0, cos_th * 0.99619 - sin_th * 0.08716);
  float specTRT = pow(cos_TRT, 14.0) * coherence;

  float crestBoost = origOklab.x > 0.50 ? min(1.0, (origOklab.x - 0.50) / 0.40) : 0.0;
  float specMod = (0.35 + 0.65 * crestBoost) * (1.0 - effGrey * 0.5);

  float specTotal = (specR * 0.22 + specTRT * 0.15) * specMod * uSpecularStrength;
  outL = min(0.98, outL + specTotal);
  outA += uSheenTintOklab.y * specTRT * specMod * 1.5;
  outB += uSheenTintOklab.z * specTRT * specMod * 1.5;

  // 5. Backlight Rim Transmission (Strictly on outer silhouette flyaways against background)
  bool isInnerFront = (vUv.x > 0.26 && vUv.x < 0.74 && vUv.y > 0.10);
  float rimFactor = sin(3.14159265 * maskVal);
  if (maskVal >= 0.85) {
    rimFactor *= (1.0 - maskVal) / 0.15;
  }
  float rim = isInnerFront ? 0.0 : (rimFactor * 0.10 * (1.0 - effGrey * 0.4));
  outL = min(0.98, outL + rim);

  // 6. Direction-Aware Continuous Grey Fibers
  if (effGrey > 0.0) {
    float sNoise = texture(uGreyStrandsTexture, vUv).r;
    float isWhiteFiber = (effGrey >= 0.98) ? 1.0 : clamp((effGrey - sNoise + 0.07) / 0.14, 0.0, 1.0);

    if (isWhiteFiber > 0.0) {
      float whiteL = clamp(0.86 * pow(k, 0.60), 0.30, 0.96);
      float whiteA = 0.002;
      float whiteB = 0.012;
      float wFactor = isWhiteFiber * min(1.0, effGrey * 1.25);

      outL = mix(outL, whiteL, wFactor);
      outA = mix(outA, whiteA, wFactor);
      outB = mix(outB, whiteB, wFactor);
    }
  }

  // 7. OKLab -> Linear RGB -> sRGB
  vec3 newLin = oklabToLinearRgb(vec3(outL, outA, outB));
  vec3 newSrgb = linearToSrgb(newLin);

  // 8. Decontaminated Clean Background Compositing with Dermis underlay
  vec3 cleanBgRgb = texture(uCleanBgTexture, vUv).rgb;
  float sAlpha = texture(uSkinTexture, vUv).r;

  if (sAlpha > 0.005) {
    if (uApplySkinRecolor > 0.5) {
      vec3 skRgb = computeBiophysicalSkin(origRgb);
      skRgb = clamp(skRgb * uLightingFilter, 0.0, 1.0);
      cleanBgRgb = mix(cleanBgRgb, skRgb, sAlpha);
    } else {
      cleanBgRgb = mix(cleanBgRgb, origRgb, sAlpha);
    }
  }

  // Final Alpha Blend
  vec3 finalColor = mix(cleanBgRgb, newSrgb, maskVal);
  fragColor = vec4(finalColor, 1.0);
}
`;

export function WebGLSalonAvatarCanvas({
  rootsColor,
  midColor,
  endsColor,
  rootsLevel = 3,
  midLevel = 5,
  endsLevel = 7,
  rootsGrey = 0,
  midGrey = 0,
  endsGrey = 0,
  blendIntensity = 0.5,
  separateZones = true,
  view = "front",
  skinTone = "fair",
  lighting = "salon",
  onFallback,
  onTelemetry,
  className = "",
}: WebGLSalonAvatarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const texturesRef = useRef<Record<string, WebGLTexture>>({});
  const vaoRef = useRef<WebGLVertexArrayObject | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadedView, setLoadedView] = useState<AvatarView | null>(null);

  // Helper to compile shader
  const compileShader = (gl: WebGL2RenderingContext, type: number, source: string): WebGLShader => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Unable to create WebGL shader");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compilation error: ${info}`);
    }
    return shader;
  };

  // Helper to upload 2D texture
  const createTextureFromImage = (gl: WebGL2RenderingContext, img: HTMLImageElement): WebGLTexture => {
    const tex = gl.createTexture();
    if (!tex) throw new Error("Failed to create WebGL texture");
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  };

  // Initialize WebGL 2.0 context and shaders
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const gl = canvas.getContext("webgl2", {
        alpha: false,
        antialias: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      });

      if (!gl) {
        throw new Error("WebGL 2.0 not supported on this browser or hardware.");
      }
      glRef.current = gl;

      // Handle context loss & restoration
      const handleContextLost = (e: Event) => {
        e.preventDefault();
        avatarTelemetry.logEvent({
          renderer: "webgl2",
          event: "context_loss",
          errorReason: "webglcontextlost event fired",
        });
      };

      const handleContextRestored = () => {
        avatarTelemetry.logEvent({
          renderer: "webgl2",
          event: "init",
          metadata: { contextRestored: true },
        });
      };

      canvas.addEventListener("webglcontextlost", handleContextLost, false);
      canvas.addEventListener("webglcontextrestored", handleContextRestored, false);

      const tShader0 = performance.now();
      const vs = compileShader(gl, gl.VERTEX_SHADER, VS_SOURCE);
      const fs = compileShader(gl, gl.FRAGMENT_SHADER, FS_SOURCE);

      const program = gl.createProgram();
      if (!program) throw new Error("Failed to create shader program");
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        throw new Error(`Shader program link failed: ${info}`);
      }
      programRef.current = program;

      // Fullscreen quad [-1, -1, 1, 1]
      const quadVertices = new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]);

      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      vaoRef.current = vao;

      const vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

      const posAttrib = gl.getAttribLocation(program, "aPosition");
      gl.enableVertexAttribArray(posAttrib);
      gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

      const tShader1 = performance.now();
      avatarTelemetry.logEvent({
        renderer: "webgl2",
        event: "shader_compile",
        durationMs: tShader1 - tShader0,
      });

      return () => {
        canvas.removeEventListener("webglcontextlost", handleContextLost);
        canvas.removeEventListener("webglcontextrestored", handleContextRestored);

        if (gl) {
          if (vaoRef.current) gl.deleteVertexArray(vaoRef.current);
          if (programRef.current) gl.deleteProgram(programRef.current);
          Object.values(texturesRef.current).forEach((tex) => gl.deleteTexture(tex));
          texturesRef.current = {};
        }
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[WebGLSalonAvatarCanvas] Initialization error, falling back to Canvas 2D:", msg);
      avatarTelemetry.logEvent({
        renderer: "webgl2",
        event: "fallback",
        errorReason: msg,
      });
      onFallback?.(msg);
    }
  }, [onFallback]);

  // Load and upload textures whenever view angle changes
  useEffect(() => {
    let isCancelled = false;
    const gl = glRef.current;
    if (!gl) return;

    setIsLoading(true);
    const tLoad0 = performance.now();
    const isFront = view === "front";

    const baseName = isFront ? "avatar_front_model.jpg" : "avatar_back_model.jpg";
    const cleanBgName = isFront ? "hair_front_clean_bg.jpg" : "hair_back_clean_bg.jpg";
    const alphaName = isFront ? "hair_front_alpha.png" : "hair_back_alpha.png";
    const zoneName = isFront ? "hair_front_zones.png" : "hair_back_zones.png";
    const flowName = isFront ? "hair_front_flow.png" : "hair_back_flow.png";
    const greyStrandsName = isFront ? "hair_front_grey_strands.png" : "hair_back_grey_strands.png";

    Promise.all([
      loadAvatarImage(getAvatarAssetUrl(baseName)),
      loadAvatarImage(getAvatarAssetUrl(cleanBgName)),
      loadAvatarImage(getAvatarAssetUrl(alphaName)),
      loadAvatarImage(getAvatarAssetUrl(zoneName)),
      loadAvatarImage(getAvatarAssetUrl(flowName)),
      loadAvatarImage(getAvatarAssetUrl(greyStrandsName)),
      isFront ? loadAvatarImage(getAvatarAssetUrl("hair_front_skin.png")) : null,
      isFront ? loadAvatarImage(getAvatarAssetUrl("hair_front_features_protect.png")) : null,
    ])
      .then(([baseImg, cleanBgImg, alphaImg, zoneImg, flowImg, greyImg, skinImg, protectImg]) => {
        if (isCancelled || !glRef.current) return;

        // Dispose previous view textures
        Object.values(texturesRef.current).forEach((tex) => gl.deleteTexture(tex));
        texturesRef.current = {};

        texturesRef.current.uBaseTexture = createTextureFromImage(gl, baseImg);
        texturesRef.current.uCleanBgTexture = createTextureFromImage(gl, cleanBgImg);
        texturesRef.current.uAlphaTexture = createTextureFromImage(gl, alphaImg);
        texturesRef.current.uZoneTexture = createTextureFromImage(gl, zoneImg);
        texturesRef.current.uFlowTexture = createTextureFromImage(gl, flowImg);
        texturesRef.current.uGreyStrandsTexture = createTextureFromImage(gl, greyImg);

        if (skinImg) {
          texturesRef.current.uSkinTexture = createTextureFromImage(gl, skinImg);
        } else {
          // 1x1 black dummy texture for back view
          const dummyTex = gl.createTexture()!;
          gl.bindTexture(gl.TEXTURE_2D, dummyTex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
          texturesRef.current.uSkinTexture = dummyTex;
        }

        if (protectImg) {
          texturesRef.current.uFeaturesProtectTexture = createTextureFromImage(gl, protectImg);
        } else {
          const dummyTex = gl.createTexture()!;
          gl.bindTexture(gl.TEXTURE_2D, dummyTex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
          texturesRef.current.uFeaturesProtectTexture = dummyTex;
        }

        const tLoad1 = performance.now();
        avatarTelemetry.logEvent({
          renderer: "webgl2",
          event: "asset_load",
          durationMs: tLoad1 - tLoad0,
          view,
        });

        setLoadedView(view);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn("[WebGLSalonAvatarCanvas] Texture loading error, falling back:", err);
          avatarTelemetry.logEvent({
            renderer: "webgl2",
            event: "fallback",
            errorReason: `Texture load failure: ${err.message}`,
            view,
          });
          onFallback?.(`Texture load failure: ${err.message}`);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [view, onFallback]);

  // Execute WebGL 2.0 Fragment Shader Render Pass (Sub-1.5 ms GPU draw call)
  const renderFrame = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const vao = vaoRef.current;
    if (!gl || !program || !vao || isLoading || loadedView !== view) return;

    const t0 = performance.now();

    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.viewport(0, 0, 896, 1200);

    // Bind all 8 textures
    const textureUnits: [string, number][] = [
      ["uBaseTexture", 0],
      ["uCleanBgTexture", 1],
      ["uAlphaTexture", 2],
      ["uZoneTexture", 3],
      ["uFlowTexture", 4],
      ["uGreyStrandsTexture", 5],
      ["uSkinTexture", 6],
      ["uFeaturesProtectTexture", 7],
    ];

    textureUnits.forEach(([name, unit]) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texturesRef.current[name] || null);
      gl.uniform1i(gl.getUniformLocation(program, name), unit);
    });

    // Colorimetry uniforms
    const [rL, rA, rB] = hexToOklab(rootsColor);
    const [mL, mA, mB] = hexToOklab(midColor);
    const [eL, eA, eB] = hexToOklab(endsColor);

    gl.uniform3f(gl.getUniformLocation(program, "uRootsOklab"), rL, rA, rB);
    gl.uniform3f(gl.getUniformLocation(program, "uMidOklab"), mL, mA, mB);
    gl.uniform3f(gl.getUniformLocation(program, "uEndsOklab"), eL, eA, eB);

    gl.uniform3f(gl.getUniformLocation(program, "uLevels"), rootsLevel, midLevel, endsLevel);
    gl.uniform3f(gl.getUniformLocation(program, "uGreys"), rootsGrey / 100.0, midGrey / 100.0, endsGrey / 100.0);
    gl.uniform1f(gl.getUniformLocation(program, "uSeparateZones"), separateZones ? 1.0 : 0.0);

    const blendPower = blendIntensity < 0.35 ? 1.7 : blendIntensity > 0.7 ? 0.7 : 1.0;
    gl.uniform1f(gl.getUniformLocation(program, "uBlendPower"), blendPower);

    // Studio Lighting & Reflectance
    const [hx, hy] = getLightingHalfVector(lighting);
    gl.uniform2f(gl.getUniformLocation(program, "uLightHalfVector"), hx, hy);

    const lightParams = getLightingEnvironmentParams(lighting);
    gl.uniform3f(
      gl.getUniformLocation(program, "uLightingFilter"),
      lightParams.filterRgb[0],
      lightParams.filterRgb[1],
      lightParams.filterRgb[2]
    );
    gl.uniform3f(
      gl.getUniformLocation(program, "uSheenTintOklab"),
      lightParams.sheenTintOklab[0],
      lightParams.sheenTintOklab[1],
      lightParams.sheenTintOklab[2]
    );
    gl.uniform1f(
      gl.getUniformLocation(program, "uSpecularStrength"),
      lightParams.specularStrength
    );

    const isFront = view === "front";
    gl.uniform3f(
      gl.getUniformLocation(program, "uMeanHair"),
      isFront ? 0.44 : 0.42,
      isFront ? 0.025 : 0.024,
      isFront ? 0.035 : 0.033
    );

    // Biophysical Dermal Melanin & Fresnel Sheen Uniforms
    const applySkin = isFront && !!skinTone;
    gl.uniform1f(gl.getUniformLocation(program, "uApplySkinRecolor"), applySkin ? 1.0 : 0.0);

    const prof = getBiophysicalSkinProfile(skinTone);
    gl.uniform3f(
      gl.getUniformLocation(program, "uSkinTargetOklab"),
      prof.targetOklab[0],
      prof.targetOklab[1],
      prof.targetOklab[2]
    );
    gl.uniform3f(
      gl.getUniformLocation(program, "uSkinTargetLipOklab"),
      prof.targetLipOklab[0],
      prof.targetLipOklab[1],
      prof.targetLipOklab[2]
    );
    gl.uniform3f(
      gl.getUniformLocation(program, "uSkinTargetIrisOklab"),
      prof.targetIrisOklab[0],
      prof.targetIrisOklab[1],
      prof.targetIrisOklab[2]
    );
    gl.uniform3f(
      gl.getUniformLocation(program, "uSkinBaseOklab"),
      MODEL_BASE_SKIN_OKLAB[0],
      MODEL_BASE_SKIN_OKLAB[1],
      MODEL_BASE_SKIN_OKLAB[2]
    );
    gl.uniform2f(
      gl.getUniformLocation(program, "uSkinParams"),
      prof.gamma,
      prof.specLuster
    );

    // Draw full-screen quad
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    const t1 = performance.now();
    const frameLatency = t1 - t0;
    const fps = frameLatency > 0 ? 1000.0 / frameLatency : 60;

    onTelemetry?.(frameLatency, fps);
    avatarTelemetry.logEvent({
      renderer: "webgl2",
      event: "frame_render",
      durationMs: frameLatency,
      fps,
      view,
    });
  }, [
    rootsColor,
    midColor,
    endsColor,
    rootsLevel,
    midLevel,
    endsLevel,
    rootsGrey,
    midGrey,
    endsGrey,
    blendIntensity,
    separateZones,
    view,
    skinTone,
    lighting,
    isLoading,
    loadedView,
    onTelemetry,
  ]);

  // Re-render whenever parameters update
  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

  return (
    <div className={`relative flex items-center justify-center w-full h-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-950/70 backdrop-blur-sm transition-opacity">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="mt-2 text-[11px] font-semibold text-neutral-300">
            Initializing GPU Shaders...
          </span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={896}
        height={1200}
        className="w-full h-full object-contain pointer-events-none"
        style={{ display: "block" }}
      />
    </div>
  );
}
