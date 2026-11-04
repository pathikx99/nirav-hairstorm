# Nirav Hairstorm — Formulation Rules Specification v1.0

## 1. Foundational Architecture & Principles

The formulation engine determines whether a target hair colour is technically and chemically achievable using verified, supported manufacturer products and declarative rules. It evaluates process feasibility before recommending any formulation.

### Non-Negotiable Principles

1. **Principle 4:** Similar visual colour does not establish chemical or formulation equivalence.
2. **Principle 6:** Unverified data must never generate executable formulations.
3. **Principle 7:** Missing technical information must remain explicitly unknown (`INSUFFICIENT_INFORMATION`).
4. **Principle 8:** Roots, mid-lengths, and ends must be independently assessable and formulated.
5. **Principle 10:** Every formulation must be reproducible using the exact catalogue, rule, and engine versions used when it was generated.
6. **Critical Chemical Invariant:** **Color does not lift artificial color** (*Tint does not lift tint*). If a region contains existing artificial pigment and the target level is lighter, the engine must never propose a standard permanent tint lift. It must require `COLOUR_REMOVAL`, `LIGHTENING`, or a `MULTI_STAGE_PROCESS`.

---

## 2. Service Feasibility Classification

The engine classifies services per region and for the overall process into 11 distinct states:

| Classification | Chemical Nature & Criteria |
|---|---|
| `DEPOSIT` | Tone deposit at same depth or slightly darker ($\Delta L \le 0$). |
| `DARKENING` | Lowering depth by $\ge 1$ level ($\Delta L < 0$). |
| `SAME_LEVEL_COLOURING` | Colour application at identical natural starting depth ($\Delta L = 0$). |
| `LIFTING` | Virgin hair depth lift using oxidative permanent colour ($1 \le \Delta L \le 3$, or $4 \le \Delta L \le 5$ with High-Lift / Special Blonde). |
| `TONING` | Tonal glazing and refinement over pre-lightened, porous, or bleached hair. |
| `NEUTRALISATION` | Corrective application targeting exposed warm underlying pigments. |
| `COLOUR_REMOVAL` | Chemical cleansing or mild decolorisation required to lift artificial dye ($\Delta L \in \{1, 2\}$ on coloured hair). |
| `LIGHTENING` | Persulfate bleach (Blondor) required for extreme lift ($\Delta L > 5$ on virgin hair, or $\Delta L \ge 3$ on artificial colour). |
| `MULTI_STAGE_PROCESS` | Sequenced multi-stage service (e.g. Stage 1 Lightening followed by Stage 2 Toning; or divergent regional conditions). |
| `UNSUPPORTED` | Technically impossible or physically hazardous requested transformation. |
| `INSUFFICIENT_INFORMATION` | Incomplete starting level, porosity, or condition data. |

---

## 3. Safety & Contraindication Rules

The safety engine validates clinical and physical constraints. Any `BLOCKED` status immediately halts formulation generation and returns an empty stages array:

### 3.1 Hard Blocking Rules

1. **Known Allergy History (`SAFETY_ALLERGY_KNOWN_HISTORY`):**
   - Condition: `has_allergy_history == True`.
   - Action: `BLOCKED`. Prohibits all oxidative chemical services. Mandates dermatological testing.
2. **Compromised Scalp (`SAFETY_SCALP_INTEGRITY`):**
   - Condition: Scalp presents lesions, abrasions, dermatitis, or open wounds.
   - Action: `BLOCKED`. Postpones chemical application until tissue is fully healed.
3. **Metallic Salts / Henna (`SAFETY_HENNA_METALLIC_SALTS`):**
   - Condition: Previous henna, vegetable dye, or metallic salt history paired with proposed oxidative lift or lightening.
   - Action: `BLOCKED`. Prevents exothermic runaway reactions, thermal injury, and severe fiber disintegration.
4. **Sodium Hydroxide (Lye) Relaxer + Bleach (`SAFETY_SODIUM_HYDROXIDE_BLEACH`):**
   - Condition: Hair chemically relaxed with sodium hydroxide paired with proposed persulfate bleaching.
   - Action: `BLOCKED`. Prevents total structural fiber dissolution.
5. **Severe Fiber Integrity Compromise (`SAFETY_SEVERELY_DAMAGED_FIBER`):**
   - Condition: Hair condition classified as `SEVERELY_DAMAGED` paired with lightening or lift $> 2$ levels.
   - Action: `BLOCKED`. Prescribes bond-repair and conditioning; halts aggressive oxidative processing.
6. **Blondor Scalp Developer Limit (`SAFETY_BLONDOR_SCALP_MAX_6PCT`):**
   - Condition: On-scalp lightener application with developer $> 6\%$ (20 Vol).
   - Action: `BLOCKED`. Enforces maximum 6% (20 Vol) on scalp to prevent chemical burns.
7. **Blondor Base Breaker & WellaPlex Incompatibility (`SAFETY_BLONDOR_BB_NO_WELLAPLEX`):**
   - Condition: Mixing WellaPlex into Blondor Base Breaker.
   - Action: `BLOCKED`. Violates manufacturer technical formulation instructions.
8. **Magma On-Scalp Contraindication (`SAFETY_MAGMA_ON_SCALP`):**
   - Condition: Direct scalp contact with Wella Magma.
   - Action: `BLOCKED`. Magma is restricted strictly to off-scalp foil/meches techniques.

### 3.2 Advisory Warnings

- **48-Hour Allergy Alert Test (`SAFETY_ALLERGY_48H_PATCH_TEST`):**
  - If patch test has not been recorded within the past 48 hours, issues an explicit advisory warning.

---

## 4. Manufacturer Technical Rules & Calculations

### 4.1 Developer Lift Matching

#### Wella Professionals (Koleston Perfect ME+)
- Same level, darker, or 1 level lift with grey coverage: **Welloxon Perfect 6% (20 Vol)**, ratio **1:1**.
- 2 levels of lift: **Welloxon Perfect 9% (30 Vol)**, ratio **1:1**.
- 3 levels of lift: **Welloxon Perfect 12% (40 Vol)**, ratio **1:1**.
- Special Blonde (12/xx):
  - 3 levels lift: **Welloxon Perfect 9% (30 Vol)**, ratio **1:2**.
  - 4–5 levels lift: **Welloxon Perfect 12% (40 Vol)**, ratio **1:2**.
- Pastel Toning / Porous Refinement: **Welloxon Perfect 1.9% (6 Vol)**, ratio **1:2**, 15–20 min.

#### L'Oréal Professionnel (Majirel)
- Same level, darker, grey coverage, or up to 2 levels lift: **Oxydant 20 Vol (6%)**, ratio **1:1.5** (50ml colour + 75ml developer).
- Up to 3 levels lift: **Oxydant 30 Vol (9%)**, ratio **1:1.5** (50ml colour + 75ml developer).

### 4.2 Grey Hair Coverage Rules

- **White Hair $< 30\%$:** 100% target fashion shade alone.
- **White Hair $30\% – 50\%$:** Add 1/3 level-matched Pure Naturals shade (20g Pure Natural + 40g Fashion Shade + 60g 6% Developer).
- **White Hair $50\% – 100\%$:** Add 1/2 level-matched Pure Naturals shade (30g Pure Natural + 30g Fashion Shade + 60g 6% Developer).
- **Vibrant Reds ($> 50\%$ white):** 2 parts red shade to 1 part Pure Natural.

### 4.3 Special Mix (Rule of 12 for Wella)

To intensify tonal reflection or neutralise unwanted underlying warmth:
$$\text{Ribbon Length (cm)} = 12 - \text{Universal Level}$$
- Weight conversion: $2\text{ cm} \approx 1.0\text{ g}$.
- Added to a standard 30g–60g base mixture without requiring additional developer.

---

## 5. Multi-Stage Process Sequencing

When pre-lightening is required:

1. **Stage 1 (Lightening / Cleansing):**
   - Product: Blondor Multi-Blonde Powder (1 part).
   - Developer: 6% Welloxon on scalp (1.5 to 2 parts).
   - Development: Up to 50 minutes under visual inspection. No artificial heat permitted.
2. **Stage 2 (Toning & Depositing):**
   - Product: Level-matched Fashion Shade / Toner (1 part).
   - Developer: Welloxon Perfect 1.9% (2 parts).
   - Development: 15–20 minutes without heat.
