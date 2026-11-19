/**
 * HairShader.ts
 * GLSL 3.00 ES Vertex and Fragment Shaders for Nirav Hairstorm Hair Avatar Studio.
 * 
 * Features:
 * - High-precision trichological pigment transfer based on luminance preservation.
 * - Normalized 3-zone regional blending (Roots, Mid-lengths, Ends).
 * - Independent facial skin recolouring (pores & shading preserved, eyes & lips protected).
 * - Scalp parting dermal illumination.
 * - Eyebrow melanin harmonization.
 * - Canities (grey strands) silver-white light scattering.
 * - Anisotropic specular reflection guided by hair tangent flow field.
 * - Environmental lighting metamerism (Sunlight, Salon LED, Office LED).
 * - Split Before / After interactive comparison plane.
 */

export const HAIR_VERTEX_SHADER = `#version 300 es
in vec2 a_position;
in vec2 a_texcoord;

out vec2 v_texcoord;

void main() {
    v_texcoord = a_texcoord;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const HAIR_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_texcoord;
out vec4 fragColor;

// Texture Samplers
uniform sampler2D u_base_texture;          // Master photograph (RGB)
uniform sampler2D u_clean_bg_texture;      // Decontaminated background plate
uniform sampler2D u_alpha_texture;         // Hair silhouette alpha mask (A)
uniform sampler2D u_zones_texture;         // Regional weights: R=Roots, G=Mid, B=Ends
uniform sampler2D u_flow_texture;          // Tangent flow: R=Tx, G=Ty, B=Coherence
uniform sampler2D u_grey_texture;          // Canities continuous strand map
uniform sampler2D u_skin_texture;          // Facial & neck dermal mask (R)
uniform sampler2D u_protect_texture;       // Eyes & lips protection mask (R)
uniform sampler2D u_eyebrows_texture;      // Eyebrow melanin coupling mask (R)
uniform sampler2D u_scalp_texture;         // Scalp parting dermal map (R)

// Regional Colour Uniforms (Linear RGB [0..1])
uniform vec3 u_roots_base;
uniform vec3 u_roots_shadow;
uniform vec3 u_roots_highlight;

uniform vec3 u_mid_base;
uniform vec3 u_mid_shadow;
uniform vec3 u_mid_highlight;

uniform vec3 u_ends_base;
uniform vec3 u_ends_shadow;
uniform vec3 u_ends_highlight;

// Eyebrow Uniform
uniform vec3 u_eyebrow_color;

// Skin Dermal Modification
uniform vec3 u_skin_scale;
uniform vec3 u_skin_offset;
uniform float u_skin_active;               // 1.0 if front view with skin mask

// Environmental Lighting Uniforms
uniform vec3 u_light_multiplier;           // Spectral color multiplier
uniform vec3 u_light_ambient;              // Ambient illuminance
uniform vec2 u_light_direction;            // Half-vector for anisotropic sheen
uniform float u_specular_intensity;        // Specular multiplier
uniform float u_specular_exponent;         // Specular exponent (sharpness)

// Grey Percentages: vec3(rootsGrey, midGrey, endsGrey) [0..100]
uniform vec3 u_grey_percentages;

// Interactive Before / After Split
uniform float u_split_x;                   // Normalized split position [0..1]
uniform float u_split_active;              // 1.0 = split active, 0.0 = show full after
uniform float u_show_original;             // 1.0 = show full before, 0.0 = normal

// Optical Helper: Luminance
float getLuminance(vec3 c) {
    return dot(c, vec3(0.299, 0.587, 0.114));
}

void main() {
    vec2 uv = v_texcoord;

    // Sample Base Photograph
    vec4 baseSample = texture(u_base_texture, uv);
    vec3 origRgb = baseSample.rgb;

    // Check Before / After Split
    bool isBeforeSide = (u_show_original > 0.5) || (u_split_active > 0.5 && uv.x < u_split_x);
    if (isBeforeSide) {
        // Draw thin golden dividing line at split boundary
        if (u_split_active > 0.5 && abs(uv.x - u_split_x) < 0.0015) {
            fragColor = vec4(0.96, 0.76, 0.28, 1.0); // Salon Gold Divider
            return;
        }
        fragColor = vec4(origRgb, 1.0);
        return;
    }

    // Sample Masks
    float hairAlpha = texture(u_alpha_texture, uv).r;
    vec3 zoneWeights = texture(u_zones_texture, uv).rgb;
    vec3 flowSample = texture(u_flow_texture, uv).rgb;
    float canitiesStrand = texture(u_grey_texture, uv).r;
    float skinWeight = u_skin_active > 0.5 ? texture(u_skin_texture, uv).r : 0.0;
    float protectWeight = u_skin_active > 0.5 ? texture(u_protect_texture, uv).r : 0.0;
    float eyebrowWeight = u_skin_active > 0.5 ? texture(u_eyebrows_texture, uv).r : 0.0;
    float scalpWeight = u_skin_active > 0.5 ? texture(u_scalp_texture, uv).r : 0.0;

    // Pure facial protection (eyes & lips) takes precedence
    skinWeight = max(0.0, skinWeight * (1.0 - protectWeight));

    // Normalize regional zone weights to prevent clipping or dark boundaries
    float totalZone = zoneWeights.r + zoneWeights.g + zoneWeights.b;
    vec3 normZones = totalZone > 0.001 ? (zoneWeights / totalZone) : vec3(0.0, 1.0, 0.0);

    // -----------------------------------------------------------------------
    // 1. HAIR FIBER RECOLOURING & OPTICAL COMPOSITING
    // -----------------------------------------------------------------------
    vec3 hairRecoloured = origRgb;

    if (hairAlpha > 0.005) {
        float origLum = getLuminance(origRgb);

        // Interpolate target regional pigment colours based on zone weights
        vec3 targetBase = normZones.r * u_roots_base + normZones.g * u_mid_base + normZones.b * u_ends_base;
        vec3 targetShadow = normZones.r * u_roots_shadow + normZones.g * u_mid_shadow + normZones.b * u_ends_shadow;
        vec3 targetHighlight = normZones.r * u_roots_highlight + normZones.g * u_mid_highlight + normZones.b * u_ends_highlight;

        // Micro-tonal depth mapping using original hair strand luminance
        vec3 mappedPigment;
        if (origLum < 0.5) {
            float t = origLum * 2.0;
            mappedPigment = mix(targetShadow, targetBase, t);
        } else {
            float t = (origLum - 0.5) * 2.0;
            mappedPigment = mix(targetBase, targetHighlight, t);
        }

        // Preserve fine strand structure and high-frequency photographic texture
        // Multiplicative luminance modulation keeps cuticle micro-highlights intact
        vec3 fiberColoured = mappedPigment * (origLum * 1.35 + 0.15);

        // -------------------------------------------------------------------
        // 2. ANISOTROPIC SPECULAR SHEEN (Marschner / Kajiya-Kay Model)
        // -------------------------------------------------------------------
        // Reconstruct tangent vector from flow map: R=Tx in [-1..1], G=Ty in [0..1]
        vec2 tangent = normalize(vec2(flowSample.r * 2.0 - 1.0, flowSample.g));
        float coherence = flowSample.b; // 0 = diffuse/frizz, 1 = sleek aligned bundle

        // Specular highlight: dot product between flow tangent and light direction
        float dotTL = dot(tangent, normalize(u_light_direction));
        float sinTL = sqrt(max(0.0, 1.0 - dotTL * dotTL));
        float specularTerm = pow(sinTL, u_specular_exponent) * u_specular_intensity * coherence;
        vec3 specularColor = targetHighlight * specularTerm * 0.45;

        // -------------------------------------------------------------------
        // 3. CANITIES (GREY HAIR) SIMULATION
        // -------------------------------------------------------------------
        // Calculate regional grey percentage
        float effGreyPct = (normZones.r * u_grey_percentages.r + 
                            normZones.g * u_grey_percentages.g + 
                            normZones.b * u_grey_percentages.b) / 100.0;

        if (effGreyPct > 0.001) {
            // Canities strands: unpigmented translucent keratin (high lightness, neutral silver reflection)
            float greyAlpha = canitiesStrand * effGreyPct * 1.5;
            vec3 silverKeratin = vec3(0.85, 0.85, 0.87) * (origLum * 0.8 + 0.45);
            fiberColoured = mix(fiberColoured, silverKeratin, clamp(greyAlpha, 0.0, 0.95));
        }

        // Combine fiber pigment, specular sheen, and ambient illumination
        hairRecoloured = fiberColoured + specularColor;

        // Environmental lighting spectral metamerism
        hairRecoloured = hairRecoloured * u_light_multiplier + u_light_ambient;

        // Scalp parting dermal show-through (natural scalp visibility at apex)
        if (scalpWeight > 0.01) {
            vec3 scalpDermal = vec3(0.92, 0.82, 0.75) * (origLum * 0.5 + 0.5);
            hairRecoloured = mix(hairRecoloured, scalpDermal, scalpWeight * 0.45);
        }
    }

    // Blend recoloured hair over original model using hair alpha
    vec3 result = mix(origRgb, hairRecoloured, hairAlpha);

    // -----------------------------------------------------------------------
    // 4. FACIAL & NECK DERMAL SKIN CUSTOMIZATION
    // -----------------------------------------------------------------------
    if (skinWeight > 0.01) {
        // Multiplicative and additive shift preserves pore detail, shadows, and contours
        vec3 skinShifted = origRgb * u_skin_scale + u_skin_offset;
        skinShifted = clamp(skinShifted, 0.0, 1.0);

        // Apply environmental illuminant to skin as well
        skinShifted = skinShifted * u_light_multiplier + (u_light_ambient * 0.5);

        result = mix(result, skinShifted, skinWeight);
    }

    // -----------------------------------------------------------------------
    // 5. EYEBROW MELANIN HARMONIZATION
    // -----------------------------------------------------------------------
    if (eyebrowWeight > 0.01) {
        float browLum = getLuminance(origRgb);
        vec3 harmonizedBrow = u_eyebrow_color * (browLum * 1.2 + 0.35);
        harmonizedBrow = harmonizedBrow * u_light_multiplier;
        result = mix(result, harmonizedBrow, eyebrowWeight * 0.75);
    }

    // Draw thin golden dividing line at split boundary if active
    if (u_split_active > 0.5 && abs(uv.x - u_split_x) < 0.0015) {
        result = vec3(0.96, 0.76, 0.28);
    }

    fragColor = vec4(clamp(result, 0.0, 1.0), 1.0);
}
`;
