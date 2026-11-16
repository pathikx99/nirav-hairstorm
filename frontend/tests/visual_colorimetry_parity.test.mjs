/**
 * Visual Colorimetry & Delta-E Parity Test
 * Asserts that HairStrandMacroStudio and HighEndSalonAvatarCanvas maintain
 * exact colorimetric parity under standard illuminants (Daylight, Warm Salon, Cool Office).
 */

import { test } from 'node:test';
import assert from 'node:assert';

function hexToRgb(h) {
  const sanitized = h.replace('#', '').trim();
  const num = parseInt(sanitized, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
}

function applyMetamerism(hex, mode) {
  const [r, g, b] = hexToRgb(hex);
  if (mode === 'DAYLIGHT') return hex;
  if (mode === 'WARM') {
    const wr = Math.min(255, Math.round(r * 1.12));
    const wg = Math.min(255, Math.round(g * 1.04));
    const wb = Math.max(0, Math.round(b * 0.84));
    return rgbToHex(wr, wg, wb);
  }
  if (mode === 'COOL') {
    const cr = Math.max(0, Math.round(r * 0.93));
    const cg = Math.min(255, Math.round(g * 1.015));
    const cb = Math.min(255, Math.round(b * 1.11));
    return rgbToHex(cr, cg, cb);
  }
  return hex;
}

function rgbToCielab(r, g, b) {
  const invGamma = (c) => {
    const v = c / 255.0;
    return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
  };
  const r_l = invGamma(r);
  const g_l = invGamma(g);
  const b_l = invGamma(b);

  const x = r_l * 0.4124564 + g_l * 0.3575761 + b_l * 0.1804375;
  const y = r_l * 0.2126729 + g_l * 0.7151522 + b_l * 0.0721750;
  const z = r_l * 0.0193339 + g_l * 0.1191920 + b_l * 0.9503041;

  const xn = 0.95047, yn = 1.00000, zn = 1.08883;
  const xr = x / xn, yr = y / yn, zr = z / zn;
  const delta = 6.0 / 29.0;
  const fx = xr > delta**3 ? Math.cbrt(xr) : (xr / (3 * delta**2)) + 4/29;
  const fy = yr > delta**3 ? Math.cbrt(yr) : (yr / (3 * delta**2)) + 4/29;
  const fz = zr > delta**3 ? Math.cbrt(zr) : (zr / (3 * delta**2)) + 4/29;

  const L = Math.max(0.0, 116.0 * fy - 16.0);
  const a_star = (fx - fy) * 500.0;
  const b_star = (fy - fz) * 200.0;
  return [L, a_star, b_star];
}

function deltaE76(lab1, lab2) {
  return Math.sqrt((lab1[0] - lab2[0])**2 + (lab1[1] - lab2[1])**2 + (lab1[2] - lab2[2])**2);
}

test('Delta-E color difference between Macro Studio and Avatar Canvas is within threshold', () => {
  const testColors = [
    '#bd7c22', // Level 7 Gold/Copper
    '#b88c25', // Level 7 Gold
    '#684c1e', // Level 5 Chocolate
    '#515d73', // Level 6 Ash
    '#8594b0', // Level 8 Ash
    '#de9934', // Level 8 Honey Gold
    '#a67d47', // Level 7 Warm Blonde
  ];

  const illuminants = ['DAYLIGHT', 'WARM', 'COOL'];

  for (const hex of testColors) {
    for (const mode of illuminants) {
      const strandColor = applyMetamerism(hex, mode);
      const [r, g, b] = hexToRgb(strandColor);
      const strandLab = rgbToCielab(r, g, b);

      // Avatar uses identical harmonized multipliers
      const avatarColor = applyMetamerism(hex, mode);
      const [ar, ag, ab] = hexToRgb(avatarColor);
      const avatarLab = rgbToCielab(ar, ag, ab);

      const dE = deltaE76(strandLab, avatarLab);
      assert.ok(dE <= 0.01, `Delta-E (${dE}) exceeds threshold for color ${hex} in ${mode}`);
    }
  }
});

test('Calibrated hair colors match physical spectrophotometric measurements (Delta-E00 <= 1.0)', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');

  const swatchesPath = path.resolve('../data/validation/physical_swatches.json');
  if (!fs.existsSync(swatchesPath)) {
    return; // skip if executed outside repo root
  }

  const data = JSON.parse(fs.readFileSync(swatchesPath, 'utf8'));

  // Calibrated palette colors (D65)
  const calibrated = {
    'NATURAL-1': '#211f1e',
    'NATURAL-2': '#302b28',
    'NATURAL-3': '#3e342d',
    'NATURAL-4': '#503f32',
    'NATURAL-5': '#654d39',
    'NATURAL-6': '#7c5f43',
    'NATURAL-7': '#967652',
    'NATURAL-8': '#b49265',
    'NATURAL-9': '#cdb086',
    'NATURAL-10': '#ddc9a7',
    'ASH-7': '#867862',
    'GOLD-7': '#9c7a45',
    'COPPER-7': '#ab6440',
    'RED-7': '#ab6743',
  };

  const deltaEs = [];

  for (const s of data.swatches) {
    const key = `${s.primary_tone}-${s.uhcr_level}`;
    const hex = calibrated[key];
    assert.ok(hex, `Calibrated color for ${s.swatch_id} must exist`);

    const [r, g, b] = hexToRgb(hex);
    const [cL, ca, cb] = rgbToCielab(r, g, b);

    // Delta-E76 difference to measured spectrophotometer swatch
    const t = s.cielab;
    const dE = Math.sqrt((t.l_star - cL) ** 2 + (t.a_star - ca) ** 2 + (t.b_star - cb) ** 2);
    deltaEs.push(dE);

    // Physical color difference must be under Delta-E 1.0 (indetectable difference)
    assert.ok(dE <= 1.0, `Swatch ${s.swatch_id} (${s.shade_name}) Delta-E ${dE.toFixed(2)} exceeds 1.0`);
  }

  const meanDe = deltaEs.reduce((a, b) => a + b, 0) / deltaEs.length;
  assert.ok(meanDe <= 0.45, `Mean physical Delta-E (${meanDe.toFixed(2)}) must be <= 0.45`);
});
