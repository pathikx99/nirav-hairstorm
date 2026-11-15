/**
 * HairShaderMaterial.ts
 * Physically informed 3D Hair Shader for Chromatique.
 * Features:
 * - Continuous UV-based 3-zone color blending (Roots -> Mid-Lengths -> Ends)
 * - Kajiya-Kay / Marschner anisotropic cuticle specular reflections
 * - Micro-strand procedural variations
 * - Studio 3-point lighting simulation (Key, Fill, Rim)
 * - Non-destructive active zone boundary outline
 */

import * as THREE from "three";

export function createHairShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uRootsColor: { value: new THREE.Color("#2a1c12") },
      uMidColor: { value: new THREE.Color("#7a583e") },
      uEndsColor: { value: new THREE.Color("#dfbf97") },
      uRootsShadow: { value: new THREE.Color("#180f09") },
      uMidShadow: { value: new THREE.Color("#4f3624") },
      uEndsShadow: { value: new THREE.Color("#a68865") },
      uRootsHighlight: { value: new THREE.Color("#483222") },
      uMidHighlight: { value: new THREE.Color("#a87d5b") },
      uEndsHighlight: { value: new THREE.Color("#fcedd7") },
      uSheenTint: { value: new THREE.Color("#ffffff") },
      uBlendIntensity: { value: 0.5 },
      uSeparateZones: { value: 1.0 },
      uActiveZone: { value: 0.0 }, // 1.0=roots, 2.0=mid, 3.0=ends, 0.0=none
      uLightingMode: { value: 1.0 }, // 0.0=sunlight, 1.0=salon, 2.0=cool
      uRoughness: { value: 0.38 },
      uAmbientIntensity: { value: 0.45 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec3 vViewPosition;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uRootsColor;
      uniform vec3 uMidColor;
      uniform vec3 uEndsColor;
      uniform vec3 uRootsShadow;
      uniform vec3 uMidShadow;
      uniform vec3 uEndsShadow;
      uniform vec3 uRootsHighlight;
      uniform vec3 uMidHighlight;
      uniform vec3 uEndsHighlight;
      uniform vec3 uSheenTint;
      uniform float uBlendIntensity;
      uniform float uSeparateZones;
      uniform float uActiveZone;
      uniform float uLightingMode;
      uniform float uRoughness;
      uniform float uAmbientIntensity;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec3 vViewPosition;

      void main() {
        // vUv.y strictly represents the strand length from root (0.0) to tip (1.0)
        float strandProgress = clamp(vUv.y, 0.0, 1.0);

        // Calculate dynamic transition widths based on blend intensity (0.0 defined to 1.0 seamless melt)
        float blendWidth1 = mix(0.04, 0.22, uBlendIntensity);
        float blendWidth2 = mix(0.04, 0.25, uBlendIntensity);

        float midWeight = smoothstep(0.20 - blendWidth1 * 0.5, 0.20 + blendWidth1 * 0.5, strandProgress);
        float endWeight = smoothstep(0.75 - blendWidth2 * 0.5, 0.75 + blendWidth2 * 0.5, strandProgress);

        vec3 baseColor;
        vec3 shadowColor;
        vec3 highlightColor;

        if (uSeparateZones < 0.5) {
          // Unified All-Over Color
          baseColor = uRootsColor;
          shadowColor = uRootsShadow;
          highlightColor = uRootsHighlight;
        } else {
          // Continuous 3-Zone Formulation
          vec3 blendedBase1 = mix(uRootsColor, uMidColor, midWeight);
          baseColor = mix(blendedBase1, uEndsColor, endWeight);

          vec3 blendedShadow1 = mix(uRootsShadow, uMidShadow, midWeight);
          shadowColor = mix(blendedShadow1, uEndsShadow, endWeight);

          vec3 blendedHigh1 = mix(uRootsHighlight, uMidHighlight, midWeight);
          highlightColor = mix(blendedHigh1, uEndsHighlight, endWeight);
        }

        // Micro-strand procedural variation along strand width to eliminate flat appearance
        float strandNoise = sin(vUv.x * 160.0 + vUv.y * 8.0) * 0.06 + cos(vUv.x * 320.0) * 0.035;
        vec3 strandBase = baseColor * (1.0 + strandNoise);

        // Normalize vectors for physically based lighting
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewPosition);

        // Tangent vector along strand flow direction for Kajiya-Kay anisotropic specular
        vec3 T = normalize(cross(N, vec3(1.0, 0.0, 0.0)));
        if (length(T) < 0.1) {
          T = normalize(cross(N, vec3(0.0, 1.0, 0.0)));
        }

        // Studio Lighting Setup
        // 1. Key Light (Top-Front Right)
        vec3 keyLightDir = normalize(vec3(1.5, 2.8, 3.2));
        vec3 keyLightColor = uLightingMode == 0.0 ? vec3(1.08, 1.02, 0.94) : // Sunlight 6500K
                             uLightingMode == 1.0 ? vec3(1.03, 0.99, 0.95) : // Salon 3000K
                                                   vec3(0.95, 0.98, 1.05);  // Cool Indoor 4000K
        float NdotL1 = max(0.0, dot(N, keyLightDir));

        // 2. Fill Light (Softer Left)
        vec3 fillLightDir = normalize(vec3(-2.2, 1.2, 2.0));
        vec3 fillLightColor = vec3(0.75, 0.76, 0.82) * 0.55;
        float NdotL2 = max(0.0, dot(N, fillLightDir));

        // 3. Rim / Hair Backlight (High Top-Rear to catch hair silhouette)
        vec3 rimLightDir = normalize(vec3(0.0, 3.0, -3.2));
        vec3 rimLightColor = uLightingMode == 0.0 ? vec3(1.15, 1.08, 0.95) :
                             uLightingMode == 1.0 ? vec3(1.05, 1.00, 0.92) :
                                                   vec3(0.95, 1.02, 1.12);
        float NdotL3 = max(0.0, dot(N, rimLightDir));

        // Diffuse Shading with Shadow / Ambient Occlusion
        float totalDiffuse = NdotL1 * 0.65 + NdotL2 * 0.35 + uAmbientIntensity;
        vec3 diffuseColor = mix(shadowColor, strandBase, clamp(totalDiffuse, 0.0, 1.0));

        // Kajiya-Kay Anisotropic Specular Highlights
        // Primary Specular (Sharp Cuticle Glint)
        vec3 H1 = normalize(keyLightDir + V);
        float dotTH1 = dot(T, H1);
        float sinTH1 = sqrt(max(0.0, 1.0 - dotTH1 * dotTH1));
        float spec1 = pow(sinTH1, 28.0) * NdotL1;

        // Secondary Colored Specular (Soft Tonal Sheen)
        float spec2 = pow(sinTH1, 14.0) * 0.45 * NdotL1;

        // Rim Specular
        vec3 H3 = normalize(rimLightDir + V);
        float dotTH3 = dot(T, H3);
        float sinTH3 = sqrt(max(0.0, 1.0 - dotTH3 * dotTH3));
        float rimSpec = pow(sinTH3, 20.0) * 0.65;

        // Combine Specular Components
        vec3 specularColor = (uSheenTint * spec1 + highlightColor * spec2) * keyLightColor +
                             uSheenTint * rimSpec * rimLightColor;

        // Final Lit Color
        vec3 finalColor = diffuseColor + specularColor;

        // Non-destructive Active Zone Indicator (Subtle luminous boundary glow that does NOT stain pigment)
        if (uActiveZone > 0.5) {
          bool inActiveZone = false;
          if (uActiveZone == 1.0 && strandProgress <= 0.22) inActiveZone = true;
          if (uActiveZone == 2.0 && strandProgress > 0.18 && strandProgress <= 0.77) inActiveZone = true;
          if (uActiveZone == 3.0 && strandProgress > 0.73) inActiveZone = true;

          if (inActiveZone) {
            float fresnelRim = pow(1.0 - max(0.0, dot(N, V)), 2.8);
            vec3 activeGlow = vec3(0.96, 0.62, 0.05); // Elegant amber gold rim
            finalColor += activeGlow * fresnelRim * 0.45;
          }
        }

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
}
