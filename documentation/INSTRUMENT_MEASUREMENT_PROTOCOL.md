# Laboratory Protocol: Physical Hair Spectrophotometry & CIELAB Calibration

**Document Code:** NH-SOP-COL-001  
**Version:** 1.0  
**Status:** Approved Standard Operating Procedure (SOP)  
**Governing Standard:** UHCR v1.0 Section 2.7 & CIE 15:2004  

---

## 1. Purpose and Scope

This Standard Operating Procedure defines the precise instrument configuration, environmental controls, sample preparation techniques, and calibration workflows required to obtain valid, reproducible CIELAB ($L^*, a^*, b^*$) coordinates from human hair swatches.

Data produced under this protocol feeds the Nirav Hairstorm physical validation suite and provides empirical ground truth for CIEDE2000 ($\Delta E_{00}$) shade matching.

---

## 2. Reference Instrument Configuration

All valid physical swatch measurements must be obtained under this locked reference configuration:

| Parameter | Specification | Standard / Requirement |
|---|---|---|
| **Illuminant** | **D65** | Average daylight (6500K) |
| **Standard Observer** | **$10^\circ$ Supplementary** | CIE 1964 standard observer |
| **Measurement Geometry** | **$d/8^\circ$ Sphere** | Diffuse illumination, $8^\circ$ viewing angle |
| **Measurement Mode** | **SCI** (Specular Component Included) | Captures total reflection independent of surface gloss |
| **Aperture Size** | **MAV ($8\text{ mm}$)** | Medium Aperture View to integrate fiber bundle texture |
| **Instrument Reference** | Konica Minolta CM-26dG / X-Rite Ci64 | Certified laboratory spectrophotometers |
| **Colour Difference Formula** | **CIEDE2000 ($\Delta E_{00}$)** | Sharma et al. (2005) implementation |

---

## 3. Sample Preparation and Presentation

Hair fibers exhibit cylindrical geometry, surface scale structure (cuticle), and anisotropic light scattering. To minimize measurement variance:

### 3.1 Fiber Cleaning and Conditioning
1. Wash swatches in standard 2% sodium laureth sulfate (SLES) neutral solution ($pH = 6.5$) at 38°C for 60 seconds.
2. Rinse thoroughly with deionized water ($< 5\,\mu\text{S/cm}$) for 120 seconds.
3. Air dry at controlled ambient conditions for 24 hours.

### 3.2 Tress Alignment and Folding
1. Align hair fibers parallel using an anti-static comb.
2. Form a flat, uniform ribbon of minimum $15\text{ mm}$ width.
3. Fold the tress into a minimum **3-layer thickness** to prevent optical translucency and background bleed-through.

### 3.3 Backing Material
- Every measurement must be conducted with the hair tress firmly mounted against a **certified white ceramic backing tile** ($L^* \ge 98.0, |a^*| \le 0.5, |b^*| \le 1.0$).
- Translucent or unbacked tress measurements are classified as `INVALID`.

---

## 4. Calibration and Environmental Controls

### 4.1 Ambient Conditions
- Room Temperature: $21^\circ\text{C} \pm 1^\circ\text{C}$
- Relative Humidity: $50\% \pm 5\%$ RH
- Measurements must not be taken under direct sunlight or uncontrolled task lighting.

### 4.2 Instrument Calibration Workflow
1. **Zero Calibration (Black Trap):** Perform black box zero calibration prior to each session.
2. **White Ceramic Tile Calibration:** Calibrate against the instrument's serialized white calibration tile.
3. Recalibration is mandatory every 4 hours or whenever ambient temperature shifts by $\ge 1.5^\circ\text{C}$.

---

## 5. Measurement Repetition and Acceptance Criteria

### 5.1 Averaging
- For each hair swatch, record **3 consecutive readings** along the length of the tress, rotating the swatch $90^\circ$ between readings to average fiber orientation effects.
- The recorded $L^*, a^*, b^*$ values represent the arithmetic mean of the 3 readings.

### 5.2 Acceptance Thresholds ($\Delta E_{00}$)
- **Instrument Repeatability:** Maximum permissible $\Delta E_{00}$ across the 3 readings on a single swatch is $\Delta E_{00} \le 0.40$.
- **Intra-Batch Swatch Tolerance:** $\Delta E_{00} \le 1.20$ between swatches dyed in the same chemical batch.
- **Visual Match Categorisation:**
  - $\Delta E_{00} \le 1.0$: Imperceptible visual difference.
  - $1.0 < \Delta E_{00} \le 2.0$: Close visual match (acceptable commercial tolerance).
  - $2.0 < \Delta E_{00} \le 3.5$: Perceptible difference, clinically acceptable in salon settings.
  - $\Delta E_{00} > 3.5$: Noticeable shade shift (requires adjustment).

---

## 6. Prevention of Data Leakage (Principle 10 & §8.3)

To ensure scientific integrity:
1. Physical tresses used for model calibration or training must be assigned distinct batch identifiers.
2. The final validation test set swatches must remain completely isolated from model tuning.
3. Swatch datasets must be versioned with cryptographic SHA-256 checksums.
