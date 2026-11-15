/**
 * ProceduralHead3D.tsx
 * Realistic 3D Human Female Head, Neck, Shoulders, and Facial Anatomy for Chromatique.
 * Built with parametric Three.js geometry and physically based skin materials.
 */

import React, { useMemo } from "react";
import * as THREE from "three";
import { AvatarSkinConfig, RenderedZoneColor } from "./AvatarTypes";

interface ProceduralHead3DProps {
  skin: AvatarSkinConfig;
  rootsColor: RenderedZoneColor;
  view: "front" | "back";
}

export const ProceduralHead3D: React.FC<ProceduralHead3DProps> = ({
  skin,
  rootsColor,
  view,
}) => {
  // PBR Skin Physical Material
  const skinMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(skin.baseHex),
      roughness: 0.48,
      metalness: 0.0,
      clearcoat: 0.16,
      clearcoatRoughness: 0.38,
      reflectivity: 0.5,
      sheen: 0.25,
      sheenColor: new THREE.Color(skin.highlightHex),
    });
  }, [skin.baseHex, skin.highlightHex]);

  // Neck & Chest Shaded Material
  const neckMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(skin.baseHex).lerp(new THREE.Color(skin.shadowHex), 0.18),
      roughness: 0.52,
      metalness: 0.0,
      clearcoat: 0.1,
    });
  }, [skin.baseHex, skin.shadowHex]);

  // Salon Cape Material
  const capeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#141417"),
      roughness: 0.85,
      metalness: 0.1,
    });
  }, []);

  // Lips Material (Plump, hydrated rose gloss)
  const lipsMaterial = useMemo(() => {
    const lipColor = new THREE.Color("#b91c1c").lerp(new THREE.Color(skin.baseHex), 0.25);
    return new THREE.MeshPhysicalMaterial({
      color: lipColor,
      roughness: 0.28,
      clearcoat: 0.75,
      clearcoatRoughness: 0.15,
      sheen: 0.3,
    });
  }, [skin.baseHex]);

  // Eyebrows Material (Inherits root depth & tone)
  const eyebrowMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(rootsColor.shadow),
      roughness: 0.75,
    });
  }, [rootsColor.shadow]);

  // Eye Sclera & Iris Materials
  const scleraMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#fafafc"),
      roughness: 0.1,
    });
  }, []);

  const irisMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#451a03"),
      roughness: 0.2,
    });
  }, []);

  const pupilMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color("#050505"),
    });
  }, []);

  const corneaMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#ffffff"),
      transmission: 0.9,
      opacity: 1,
      transparent: true,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      ior: 1.336,
    });
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Sculpted Oval Head Anatomy */}
      {/* Cranium / Face Foundation */}
      <mesh position={[0, 0.42, -0.04]} material={skinMaterial}>
        <sphereGeometry args={[0.92, 48, 48]} />
      </mesh>

      {/* Cheeks and Lower Face Contour */}
      <mesh position={[0, 0.16, 0.12]} scale={[0.82, 0.96, 0.78]} material={skinMaterial}>
        <sphereGeometry args={[0.88, 40, 40]} />
      </mesh>

      {/* Feminine Rounded Chin */}
      <mesh position={[0, -0.48, 0.38]} scale={[0.42, 0.38, 0.48]} material={skinMaterial}>
        <sphereGeometry args={[0.46, 32, 32]} />
      </mesh>

      {/* Zygomatic Cheekbone Highlights */}
      <mesh position={[-0.48, 0.12, 0.42]} scale={[0.34, 0.26, 0.34]} material={skinMaterial}>
        <sphereGeometry args={[0.42, 24, 24]} />
      </mesh>
      <mesh position={[0.48, 0.12, 0.42]} scale={[0.34, 0.26, 0.34]} material={skinMaterial}>
        <sphereGeometry args={[0.42, 24, 24]} />
      </mesh>

      {/* 2. Slender Neck & Trapezius Shoulders */}
      <mesh position={[0, -0.92, -0.06]} material={neckMaterial}>
        <cylinderGeometry args={[0.38, 0.44, 0.88, 36]} />
      </mesh>

      {/* Clavicle Collarbones */}
      <mesh position={[-0.42, -1.34, 0.24]} rotation={[0, 0, -0.15]} material={skinMaterial}>
        <boxGeometry args={[0.82, 0.08, 0.14]} />
      </mesh>
      <mesh position={[0.42, -1.34, 0.24]} rotation={[0, 0, 0.15]} material={skinMaterial}>
        <boxGeometry args={[0.82, 0.08, 0.14]} />
      </mesh>

      {/* Salon Chic Shoulder Drape / Cape */}
      <mesh position={[0, -1.82, -0.04]} material={capeMaterial}>
        <cylinderGeometry args={[1.05, 1.48, 1.15, 36]} />
      </mesh>

      {/* 3. Sculpted Ears */}
      {/* Left Ear */}
      <group position={[-0.88, 0.34, -0.04]} rotation={[0.1, -0.25, -0.1]}>
        <mesh material={skinMaterial}>
          <cylinderGeometry args={[0.18, 0.14, 0.46, 18]} />
        </mesh>
      </group>
      {/* Right Ear */}
      <group position={[0.88, 0.34, -0.04]} rotation={[0.1, 0.25, 0.1]}>
        <mesh material={skinMaterial}>
          <cylinderGeometry args={[0.18, 0.14, 0.46, 18]} />
        </mesh>
      </group>

      {/* 4. Facial Features (Visible in Front / 3/4 View) */}
      {/* Symmetrical Contoured Nose */}
      <group position={[0, 0.14, 0.82]}>
        {/* Bridge */}
        <mesh position={[0, 0.14, 0.02]} rotation={[-0.22, 0, 0]} material={skinMaterial}>
          <cylinderGeometry args={[0.07, 0.09, 0.42, 18]} />
        </mesh>
        {/* Tip */}
        <mesh position={[0, -0.08, 0.1]} material={skinMaterial}>
          <sphereGeometry args={[0.11, 24, 24]} />
        </mesh>
        {/* Alar Wings */}
        <mesh position={[-0.11, -0.1, 0.02]} material={skinMaterial}>
          <sphereGeometry args={[0.075, 18, 18]} />
        </mesh>
        <mesh position={[0.11, -0.1, 0.02]} material={skinMaterial}>
          <sphereGeometry args={[0.075, 18, 18]} />
        </mesh>
      </group>

      {/* Natural Feminine Lips with Cupid's Bow */}
      <group position={[0, -0.24, 0.76]}>
        {/* Upper Lip */}
        <mesh position={[-0.1, 0.035, 0.03]} rotation={[0, 0, -0.08]} material={lipsMaterial}>
          <capsuleGeometry args={[0.05, 0.16, 12, 18]} />
        </mesh>
        <mesh position={[0.1, 0.035, 0.03]} rotation={[0, 0, 0.08]} material={lipsMaterial}>
          <capsuleGeometry args={[0.05, 0.16, 12, 18]} />
        </mesh>
        {/* Lower Lip */}
        <mesh position={[0, -0.05, 0.02]} rotation={[0, 0, Math.PI / 2]} material={lipsMaterial}>
          <capsuleGeometry args={[0.07, 0.28, 12, 18]} />
        </mesh>
      </group>

      {/* Symmetrical Almond Eyes */}
      {/* Left Eye */}
      <group position={[-0.34, 0.36, 0.68]} rotation={[0, 0.08, 0]}>
        {/* Sclera */}
        <mesh material={scleraMaterial}>
          <sphereGeometry args={[0.16, 28, 28]} />
        </mesh>
        {/* Iris */}
        <mesh position={[0, 0, 0.11]} rotation={[Math.PI / 2, 0, 0]} material={irisMaterial}>
          <circleGeometry args={[0.075, 28]} />
        </mesh>
        {/* Pupil */}
        <mesh position={[0, 0, 0.115]} rotation={[Math.PI / 2, 0, 0]} material={pupilMaterial}>
          <circleGeometry args={[0.038, 24]} />
        </mesh>
        {/* Cornea Glint */}
        <mesh position={[0, 0, 0.08]} material={corneaMaterial}>
          <sphereGeometry args={[0.13, 20, 20]} />
        </mesh>
        {/* Upper Eyelash Line */}
        <mesh position={[0, 0.08, 0.11]} rotation={[0, 0, 0.08]} material={eyebrowMaterial}>
          <capsuleGeometry args={[0.018, 0.26, 8, 16]} />
        </mesh>
      </group>

      {/* Right Eye */}
      <group position={[0.34, 0.36, 0.68]} rotation={[0, -0.08, 0]}>
        {/* Sclera */}
        <mesh material={scleraMaterial}>
          <sphereGeometry args={[0.16, 28, 28]} />
        </mesh>
        {/* Iris */}
        <mesh position={[0, 0, 0.11]} rotation={[Math.PI / 2, 0, 0]} material={irisMaterial}>
          <circleGeometry args={[0.075, 28]} />
        </mesh>
        {/* Pupil */}
        <mesh position={[0, 0, 0.115]} rotation={[Math.PI / 2, 0, 0]} material={pupilMaterial}>
          <circleGeometry args={[0.038, 24]} />
        </mesh>
        {/* Cornea Glint */}
        <mesh position={[0, 0, 0.08]} material={corneaMaterial}>
          <sphereGeometry args={[0.13, 20, 20]} />
        </mesh>
        {/* Upper Eyelash Line */}
        <mesh position={[0, 0.08, 0.11]} rotation={[0, 0, -0.08]} material={eyebrowMaterial}>
          <capsuleGeometry args={[0.018, 0.26, 8, 16]} />
        </mesh>
      </group>

      {/* Natural Eyebrows */}
      {/* Left Eyebrow */}
      <mesh position={[-0.35, 0.58, 0.72]} rotation={[-0.1, 0.08, 0.15]} material={eyebrowMaterial}>
        <capsuleGeometry args={[0.032, 0.32, 10, 18]} />
      </mesh>
      {/* Right Eyebrow */}
      <mesh position={[0.35, 0.58, 0.72]} rotation={[-0.1, -0.08, -0.15]} material={eyebrowMaterial}>
        <capsuleGeometry args={[0.032, 0.32, 10, 18]} />
      </mesh>
    </group>
  );
};
