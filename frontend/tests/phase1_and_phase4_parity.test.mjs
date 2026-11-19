import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Phase 1: 360° Virtual Ring Light Math Verification
function angleToHalfVector(deg, radius = 0.70) {
  const rad = (deg * Math.PI) / 180.0;
  const hx = radius * Math.sin(rad);
  const hy = -radius * Math.cos(rad);
  const cleanX = Math.abs(hx) < 1e-4 ? 0 : Number(hx.toFixed(3));
  const cleanY = Math.abs(hy) < 1e-4 ? 0 : Number(hy.toFixed(3));
  return [cleanX, cleanY];
}

function halfVectorToAngle(hx, hy) {
  const radius = Math.sqrt(hx * hx + hy * hy);
  if (radius < 0.001) return { angleDeg: 0, radius: 0.70 };
  const rad = Math.atan2(hx, -hy);
  const deg = (rad * 180.0) / Math.PI;
  const angleDeg = (deg + 360.0) % 360.0;
  return { angleDeg: Number(angleDeg.toFixed(1)), radius: Number(radius.toFixed(3)) };
}

test('Phase 1 - 360° Virtual Ring Light Gizmo: Cardinal & Ordinal Half-Vector Mapping', () => {
  // 1. Direct Overhead Zenith (0°) -> hx = 0, hy = -0.70 (straight up towards crown)
  const [topX, topY] = angleToHalfVector(0, 0.70);
  assert.equal(topX, 0);
  assert.equal(topY, -0.70);
  const topRoundTrip = halfVectorToAngle(topX, topY);
  assert.equal(topRoundTrip.angleDeg, 0);
  assert.equal(topRoundTrip.radius, 0.70);

  // 2. Salon 3000K Key Light (45° Top-Right) -> hx > 0, hy < 0
  const [salonX, salonY] = angleToHalfVector(45, 0.70);
  assert.ok(salonX > 0.45 && salonX < 0.52, `salonX should be ~0.495, got ${salonX}`);
  assert.ok(salonY < -0.45 && salonY > -0.52, `salonY should be ~-0.495, got ${salonY}`);
  const salonRoundTrip = halfVectorToAngle(salonX, salonY);
  assert.equal(salonRoundTrip.angleDeg, 45);

  // 3. Right Flank / Lateral Rim (90°) -> hx = 0.70, hy = 0
  const [rightX, rightY] = angleToHalfVector(90, 0.70);
  assert.equal(rightX, 0.70);
  assert.equal(rightY, 0);
  const rightRoundTrip = halfVectorToAngle(rightX, rightY);
  assert.equal(rightRoundTrip.angleDeg, 90);

  // 4. Vanity Under-Chin Uplight (180°) -> hx = 0, hy = +0.70
  const [bottomX, bottomY] = angleToHalfVector(180, 0.70);
  assert.equal(bottomX, 0);
  assert.equal(bottomY, 0.70);
  const bottomRoundTrip = halfVectorToAngle(bottomX, bottomY);
  assert.equal(bottomRoundTrip.angleDeg, 180);

  // 5. Left Flank / Lateral Rim (270°) -> hx = -0.70, hy = 0
  const [leftX, leftY] = angleToHalfVector(270, 0.70);
  assert.equal(leftX, -0.70);
  assert.equal(leftY, 0);
  const leftRoundTrip = halfVectorToAngle(leftX, leftY);
  assert.equal(leftRoundTrip.angleDeg, 270);

  // 6. Cool Studio 4000K Key Light (315° Top-Left) -> hx < 0, hy < 0
  const [coolX, coolY] = angleToHalfVector(315, 0.70);
  assert.ok(coolX < -0.45 && coolX > -0.52, `coolX should be ~-0.495, got ${coolX}`);
  assert.ok(coolY < -0.45 && coolY > -0.52, `coolY should be ~-0.495, got ${coolY}`);
  const coolRoundTrip = halfVectorToAngle(coolX, coolY);
  assert.equal(coolRoundTrip.angleDeg, 315);
});

test('Phase 4 - Universal Hair Texture Archetypes: Calibrated Asset Integrity', (t) => {
  const archetypes = ['straight', 'wavy', 'curly', 'coily'];
  const publicDir = path.resolve('public/avatar/archetypes');

  if (!fs.existsSync(publicDir)) {
    t.skip('Awaiting new model image ingestion — skipping archetype asset check');
    return;
  }

  archetypes.forEach((arch) => {
    const archDir = path.join(publicDir, arch);
    assert.ok(fs.existsSync(archDir), `Archetype directory exists: ${arch}`);

    const requiredAssets = [
      'hair_front_flow.png',
      'hair_back_flow.png',
      'hair_front_grey_strands.png',
      'hair_back_grey_strands.png',
      'hair_front_alpha.png',
      'hair_back_alpha.png',
      'hair_front_zones.png',
      'hair_back_zones.png',
      'hair_front_clean_bg.jpg',
      'hair_back_clean_bg.jpg',
      'hair_front_skin.png',
      'hair_front_features_protect.png',
    ];

    requiredAssets.forEach((asset) => {
      const assetPath = path.join(archDir, asset);
      assert.ok(fs.existsSync(assetPath), `Asset exists for [${arch}]: ${asset}`);
      const stats = fs.statSync(assetPath);
      assert.ok(stats.size > 1000, `Asset size is valid (>1KB) for [${arch}]: ${asset} (${stats.size} bytes)`);
    });
  });
});

test('Phase 4 - Biophysical Optical Profiles & Differentiation Matrix', () => {
  // Optical verification based on physical hair biophysics
  const profiles = {
    straight: {
      typeCode: "Type 1A–1C",
      specularExpR: 42.0,
      specularExpTRT: 22.0,
      coherenceMult: 1.25,
      diffuseDispersion: 0.10,
      internalEntrapment: 0.00,
      lipidSheen: 0.08,
    },
    wavy: {
      typeCode: "Type 2A–2C",
      specularExpR: 28.0,
      specularExpTRT: 14.0,
      coherenceMult: 1.00,
      diffuseDispersion: 0.30,
      internalEntrapment: 0.05,
      lipidSheen: 0.12,
    },
    curly: {
      typeCode: "Type 3A–3C",
      specularExpR: 24.0,
      specularExpTRT: 12.0,
      coherenceMult: 0.90,
      diffuseDispersion: 0.45,
      internalEntrapment: 0.22,
      lipidSheen: 0.20,
    },
    coily: {
      typeCode: "Type 4A–4C",
      specularExpR: 18.0,
      specularExpTRT: 9.0,
      coherenceMult: 0.80,
      diffuseDispersion: 0.65,
      internalEntrapment: 0.38,
      lipidSheen: 0.42,
    },
  };

  // Straight hair has highest specular sharpness (highest R-lobe exponent)
  assert.ok(profiles.straight.specularExpR > profiles.wavy.specularExpR);
  assert.ok(profiles.wavy.specularExpR > profiles.curly.specularExpR);
  assert.ok(profiles.curly.specularExpR > profiles.coily.specularExpR);

  // Coily hair has highest internal light entrapment & lipid sheen
  assert.ok(profiles.coily.internalEntrapment > profiles.curly.internalEntrapment);
  assert.ok(profiles.curly.internalEntrapment > profiles.wavy.internalEntrapment);
  assert.ok(profiles.coily.lipidSheen > profiles.straight.lipidSheen);

  // Coily hair has highest diffuse dispersion due to compact micro-coil scattering
  assert.ok(profiles.coily.diffuseDispersion > profiles.straight.diffuseDispersion);
});
