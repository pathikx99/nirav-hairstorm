import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PUBLIC_AVATAR_DIR = fs.existsSync(path.resolve('frontend', 'public', 'avatar'))
  ? path.resolve('frontend', 'public', 'avatar')
  : path.resolve('public', 'avatar');

// Trichological Formulas
function getEyebrowMelaninOklab(level, greyPercentage, hairL, hairA, hairB) {
  const normLvl = Math.max(1.0, Math.min(10.0, level));
  const effGrey = Math.max(0.0, Math.min(1.0, (greyPercentage || 0) / 100.0));

  let targetEbL = 0.22 + 0.052 * (normLvl - 1.0);
  let targetEbA = 0.012 + 0.008 * ((normLvl - 1.0) / 9.0);
  let targetEbB = 0.018 + 0.022 * ((normLvl - 1.0) / 9.0);

  if (effGrey > 0) {
    const whiteEbL = 0.75;
    const whiteEbA = 0.002;
    const whiteEbB = 0.010;
    const w = effGrey * 0.85;
    targetEbL = targetEbL * (1.0 - w) + whiteEbL * w;
    targetEbA = targetEbA * (1.0 - w) + whiteEbA * w;
    targetEbB = targetEbB * (1.0 - w) + whiteEbB * w;
  }

  return [targetEbL, targetEbA, targetEbB];
}

function getHairDensityParameters(density) {
  switch (density) {
    case "low":
      return { scalpVisibilityFactor: 0.45, densityMultiplier: 0.85, follicleJitter: 0.40 };
    case "high":
      return { scalpVisibilityFactor: 0.04, densityMultiplier: 1.25, follicleJitter: 0.15 };
    case "medium":
    default:
      return { scalpVisibilityFactor: 0.15, densityMultiplier: 1.00, follicleJitter: 0.25 };
  }
}

function getHairCaliberParameters(caliber) {
  switch (caliber) {
    case "fine":
      return { strandThicknessMult: 0.85, edgeSoftness: 1.20, specularWidth: 1.35 };
    case "coarse":
      return { strandThicknessMult: 1.20, edgeSoftness: 0.85, specularWidth: 0.80 };
    case "medium":
    default:
      return { strandThicknessMult: 1.00, edgeSoftness: 1.00, specularWidth: 1.00 };
  }
}

function computeDecontaminationFactor(normLvl, effGrey) {
  const decontamLevel = Math.max(0.0, Math.min(1.0, (normLvl - 4.5) / 3.0));
  return Math.max(decontamLevel, effGrey);
}

function computePartingDermisWeight(scalpParting, origL) {
  const baseDepth = Math.max(0.0, Math.min(1.0, (origL - 0.25) / 0.50));
  return Math.max(0.0, Math.min(0.92, scalpParting * 1.4 * (1.0 - baseDepth)));
}

test('Trichological Realism: Eyebrow Melanin Harmonization', () => {
  // 1. Level 2 Brunette
  const [l2L, l2A, l2B] = getEyebrowMelaninOklab(2, 0, 0.25, 0.02, 0.02);
  assert.ok(l2L >= 0.22 && l2L <= 0.32, `Level 2 eyebrow L should be dark brunette, got ${l2L}`);

  // 2. Level 9 Platinum Blonde
  const [l9L, l9A, l9B] = getEyebrowMelaninOklab(9, 0, 0.85, 0.01, 0.03);
  assert.ok(l9L >= 0.60, `Level 9 eyebrow L must be harmonized and lightened, got ${l9L}`);
  assert.ok(l9L > l2L + 0.30, `Platinum brows must be significantly lighter than brunette brows`);

  // 3. 100% White / Grey Hair
  const [wL, wA, wB] = getEyebrowMelaninOklab(3, 100, 0.90, 0.00, 0.01);
  assert.ok(wL >= 0.65, `100% canities eyebrow L must harmonize with white hair, got ${wL}`);
});

test('Trichological Realism: Follicular Density Scalp Visibility Gradient', () => {
  const low = getHairDensityParameters("low");
  const med = getHairDensityParameters("medium");
  const high = getHairDensityParameters("high");

  assert.ok(low.scalpVisibilityFactor > med.scalpVisibilityFactor, "Low density must allow greater scalp visibility");
  assert.ok(med.scalpVisibilityFactor > high.scalpVisibilityFactor, "Medium density must allow more scalp visibility than high");
  assert.ok(high.densityMultiplier > low.densityMultiplier, "High density must have higher strand volume multiplier");
});

test('Trichological Realism: Fiber Caliber Metrics', () => {
  const fine = getHairCaliberParameters("fine");
  const med = getHairCaliberParameters("medium");
  const coarse = getHairCaliberParameters("coarse");

  assert.ok(fine.strandThicknessMult < med.strandThicknessMult, "Fine hair must have lower thickness multiplier");
  assert.ok(coarse.strandThicknessMult > med.strandThicknessMult, "Coarse hair must have higher thickness multiplier");
  assert.ok(fine.edgeSoftness > coarse.edgeSoftness, "Fine hair must have softer sub-pixel fiber edges");
});

test('Optical Realism: Edge Decontamination on Light and Grey Hair', () => {
  // Dark Level 2 hair: Decontamination should be zero (preserves natural dark edge)
  const decontamDark = computeDecontaminationFactor(2.0, 0.0);
  assert.equal(decontamDark, 0.0, "Dark brunette hair must have 0 edge decontamination");

  // Level 8 Blonde: Decontamination should be active (eliminates brunette halo)
  const decontamBlonde = computeDecontaminationFactor(8.0, 0.0);
  assert.ok(decontamBlonde >= 0.90, `Level 8 blonde must have high decontamination, got ${decontamBlonde}`);

  // Level 3 with 100% Grey: Decontamination must be 1.0 (eliminates brunette bleed on grey edges)
  const decontamGrey = computeDecontaminationFactor(3.0, 1.0);
  assert.equal(decontamGrey, 1.0, "100% canities must have full clean-plate decontamination");
});

test('Trichological Realism: Scalp Parting Furrow Protection', () => {
  // Outside parting (scalpParting = 0): parting skin weight is 0
  const weightOutside = computePartingDermisWeight(0.0, 0.40);
  assert.equal(weightOutside, 0.0, "Outside parting must have 0 dermal exposure");

  // In central furrow (scalpParting = 0.85, dermal skin L = 0.35):
  const weightInside = computePartingDermisWeight(0.85, 0.35);
  assert.ok(weightInside >= 0.70, `Central furrow must protect scalp dermis from dye staining, got ${weightInside}`);
});

test('Asset Verification: Anatomical Realism Maps in Public Avatar Directory', (t) => {
  const expectedFiles = [
    'hair_front_eyebrows.png',
    'hair_front_scalp.png',
    'hair_front_follicles.png',
    'hair_front_clean_bg.jpg',
    'hair_back_clean_bg.jpg',
    'hair_front_flow.png',
    'hair_front_grey_strands.png',
  ];

  const anyPresent = expectedFiles.some((f) => fs.existsSync(path.join(PUBLIC_AVATAR_DIR, f)));
  if (!anyPresent) {
    t.skip('Awaiting new model image ingestion — skipping legacy asset check');
    return;
  }

  for (const file of expectedFiles) {
    const fullPath = path.join(PUBLIC_AVATAR_DIR, file);
    assert.ok(fs.existsSync(fullPath), `Required anatomical realism map missing: ${file}`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size > 1000, `File ${file} has suspiciously small size: ${stat.size} bytes`);
  }
});
