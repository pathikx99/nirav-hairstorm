/**
 * ProceduralHair3D.tsx
 * Multi-layered 3D hair geometry for Chromatique.
 * Comprises:
 * 1. Volumetric scalp & crown cap
 * 2. Hundreds of layered parametric 3D wave ribbons with continuous UVs (0.0=root, 1.0=tip)
 * 3. Face-framing curtain strands and back waterfall cascade
 * 4. Fine surface flyaway wisps
 * Powered by HairShaderMaterial.
 */

import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { RenderedHairPalette, HairZoneId, LightingPreset } from "./AvatarTypes";
import { createHairShaderMaterial } from "./HairShaderMaterial";

interface ProceduralHair3DProps {
  palette: RenderedHairPalette;
  activeZone: HairZoneId;
  lighting: LightingPreset;
}

// Helper to create a flat curved ribbon geometry from a 3D CatmullRom curve
function createCurvedRibbonGeometry(
  curve: THREE.CatmullRomCurve3,
  widthStart: number,
  widthEnd: number,
  segments: number = 24
): THREE.BufferGeometry {
  const points = curve.getPoints(segments);
  const tangents = curve.computeFrenetFrames(segments, false).tangents;
  const normals = curve.computeFrenetFrames(segments, false).normals;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const normalAttrs: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const p = points[i];
    const t = tangents[i];
    const n = normals[i];
    const binormal = new THREE.Vector3().crossVectors(t, n).normalize();

    const progress = i / segments; // 0.0 at root -> 1.0 at tip
    const currentWidth = THREE.MathUtils.lerp(widthStart, widthEnd, progress);

    // Left vertex
    const leftPos = new THREE.Vector3().copy(p).addScaledVector(binormal, -currentWidth * 0.5);
    // Right vertex
    const rightPos = new THREE.Vector3().copy(p).addScaledVector(binormal, currentWidth * 0.5);

    positions.push(leftPos.x, leftPos.y, leftPos.z);
    positions.push(rightPos.x, rightPos.y, rightPos.z);

    // UVs: x across ribbon width (0.0 to 1.0), y along strand length (0.0 to 1.0)
    uvs.push(0.0, progress);
    uvs.push(1.0, progress);

    normalAttrs.push(n.x, n.y, n.z);
    normalAttrs.push(n.x, n.y, n.z);

    if (i < segments) {
      const baseIndex = i * 2;
      indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
      indices.push(baseIndex + 1, baseIndex + 3, baseIndex + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normalAttrs, 3));
  geometry.setIndex(indices);
  return geometry;
}

export const ProceduralHair3D: React.FC<ProceduralHair3DProps> = ({
  palette,
  activeZone,
  lighting,
}) => {
  const { roots, midLengths, ends, blendIntensity, separateZones } = palette;

  // Single shared HairShaderMaterial instance with real-time uniform updates
  const hairMaterial = useMemo(() => {
    return createHairShaderMaterial();
  }, []);

  // Update uniforms when palette or state changes
  useEffect(() => {
    hairMaterial.uniforms.uRootsColor.value.set(roots.base);
    hairMaterial.uniforms.uRootsShadow.value.set(roots.shadow);
    hairMaterial.uniforms.uRootsHighlight.value.set(roots.highlight);

    hairMaterial.uniforms.uMidColor.value.set(midLengths.base);
    hairMaterial.uniforms.uMidShadow.value.set(midLengths.shadow);
    hairMaterial.uniforms.uMidHighlight.value.set(midLengths.highlight);

    hairMaterial.uniforms.uEndsColor.value.set(ends.base);
    hairMaterial.uniforms.uEndsShadow.value.set(ends.shadow);
    hairMaterial.uniforms.uEndsHighlight.value.set(ends.highlight);

    hairMaterial.uniforms.uSheenTint.value.set(roots.sheen);
    hairMaterial.uniforms.uBlendIntensity.value = blendIntensity;
    hairMaterial.uniforms.uSeparateZones.value = separateZones ? 1.0 : 0.0;
    hairMaterial.uniforms.uActiveZone.value =
      activeZone === "roots" ? 1.0 : activeZone === "midLengths" ? 2.0 : activeZone === "ends" ? 3.0 : 0.0;
    hairMaterial.uniforms.uLightingMode.value =
      lighting === "sunlight" ? 0.0 : lighting === "salon" ? 1.0 : 2.0;
  }, [hairMaterial, roots, midLengths, ends, blendIntensity, separateZones, activeZone, lighting]);

  // Generate 3D Hair Ribbon Meshes
  const ribbonGeometries = useMemo(() => {
    const geoms: THREE.BufferGeometry[] = [];

    // 1. Crown Whorl & Parting Foundation Strands (Roots 0.0 -> Mid 0.5)
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(cos * 0.08, 1.25, sin * 0.08 - 0.05),
        new THREE.Vector3(cos * 0.42, 1.18, sin * 0.38 - 0.06),
        new THREE.Vector3(cos * 0.78, 0.94, sin * 0.68 - 0.08),
        new THREE.Vector3(cos * 0.92, 0.62, sin * 0.82 - 0.1),
      ]);
      geoms.push(createCurvedRibbonGeometry(curve, 0.14, 0.18, 18));
    }

    // 2. Left Front Flowing Beach Waves (Cascading over left shoulder & chest)
    for (let i = 0; i < 42; i++) {
      const t = i / 42;
      const xStart = -0.15 - t * 0.72;
      const zStart = 0.28 - t * 0.45;
      const wavePhase = i * 0.35;

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(xStart, 1.18, zStart),
        new THREE.Vector3(xStart - 0.28, 0.82, zStart + 0.18),
        new THREE.Vector3(xStart - 0.35 + Math.sin(wavePhase) * 0.12, 0.32, zStart + 0.35),
        new THREE.Vector3(xStart - 0.22 + Math.cos(wavePhase) * 0.14, -0.28, zStart + 0.48),
        new THREE.Vector3(xStart - 0.12, -0.85, zStart + 0.52),
        new THREE.Vector3(xStart - 0.05, -1.45, zStart + 0.45),
      ]);
      geoms.push(createCurvedRibbonGeometry(curve, 0.12, 0.06, 28));
    }

    // 3. Right Front Flowing Beach Waves (Cascading over right shoulder & chest)
    for (let i = 0; i < 42; i++) {
      const t = i / 42;
      const xStart = 0.15 + t * 0.72;
      const zStart = 0.28 - t * 0.45;
      const wavePhase = i * 0.35 + 1.2;

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(xStart, 1.18, zStart),
        new THREE.Vector3(xStart + 0.28, 0.82, zStart + 0.18),
        new THREE.Vector3(xStart + 0.35 + Math.sin(wavePhase) * 0.12, 0.32, zStart + 0.35),
        new THREE.Vector3(xStart + 0.22 + Math.cos(wavePhase) * 0.14, -0.28, zStart + 0.48),
        new THREE.Vector3(xStart + 0.12, -0.85, zStart + 0.52),
        new THREE.Vector3(xStart + 0.05, -1.45, zStart + 0.45),
      ]);
      geoms.push(createCurvedRibbonGeometry(curve, 0.12, 0.06, 28));
    }

    // 4. Back Waterfall Cascade (Flowing down behind back from crown past waist)
    for (let i = 0; i < 68; i++) {
      const t = (i - 34) / 34; // -1 to 1
      const xBase = t * 0.88;
      const wave = Math.sin(i * 0.42) * 0.15;

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(xBase * 0.45, 1.22, -0.42),
        new THREE.Vector3(xBase * 0.82, 0.88, -0.82),
        new THREE.Vector3(xBase * 0.95 + wave, 0.25, -0.92),
        new THREE.Vector3(xBase * 0.92 - wave, -0.45, -0.95),
        new THREE.Vector3(xBase * 0.78 + wave * 0.6, -1.15, -0.88),
        new THREE.Vector3(xBase * 0.55, -1.75, -0.82),
      ]);
      geoms.push(createCurvedRibbonGeometry(curve, 0.15, 0.05, 30));
    }

    // 5. Face-Framing Curtain Bang Strands (Soft contour around cheeks & jawline)
    for (let i = 0; i < 22; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const offset = (Math.floor(i / 2) / 11) * 0.18;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * (0.08 + offset), 1.15, 0.62),
        new THREE.Vector3(side * (0.28 + offset * 1.5), 0.78, 0.72),
        new THREE.Vector3(side * (0.45 + offset * 1.8), 0.35, 0.76),
        new THREE.Vector3(side * (0.42 + offset * 1.2), -0.05, 0.68),
        new THREE.Vector3(side * (0.32 + offset * 0.8), -0.45, 0.58),
      ]);
      geoms.push(createCurvedRibbonGeometry(curve, 0.08, 0.03, 22));
    }

    // 6. Fine Surface Flyaways & Organic Silhouette Wisps
    for (let i = 0; i < 24; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const t = (i / 24) * 0.85;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * (0.45 + t * 0.55), 1.05 - t * 0.4, 0.15),
        new THREE.Vector3(side * (0.75 + t * 0.42), 0.52 - t * 0.6, 0.22),
        new THREE.Vector3(side * (0.85 + t * 0.32), -0.15 - t * 0.6, 0.18),
        new THREE.Vector3(side * (0.62 + t * 0.18), -0.95 - t * 0.4, 0.12),
      ]);
      geoms.push(createCurvedRibbonGeometry(curve, 0.035, 0.015, 24));
    }

    return geoms;
  }, []);

  // Volumetric Scalp & Hair Helmet geometry
  const scalpGeometry = useMemo(() => {
    const geom = new THREE.SphereGeometry(0.96, 42, 42);
    // Custom UVs so y goes from 0.0 at top apex to 0.45 at base
    const uvs = geom.attributes.uv;
    for (let i = 0; i < uvs.count; i++) {
      const u = uvs.getX(i);
      const v = uvs.getY(i);
      // In Three.js SphereGeometry, v is 1 at north pole, 0 at south pole
      const strandLen = (1.0 - v) * 0.45;
      uvs.setXY(i, u, strandLen);
    }
    uvs.needsUpdate = true;
    return geom;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Volumetric Scalp Base Cap (Prevents see-through) */}
      <mesh
        geometry={scalpGeometry}
        material={hairMaterial}
        position={[0, 0.44, -0.06]}
        scale={[1.04, 1.05, 1.06]}
      />

      {/* 2. Hundreds of Layered 3D Hair Strands and Ribbons */}
      {ribbonGeometries.map((geom, idx) => (
        <mesh key={idx} geometry={geom} material={hairMaterial} />
      ))}
    </group>
  );
};
