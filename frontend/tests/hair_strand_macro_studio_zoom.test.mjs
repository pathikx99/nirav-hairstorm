import { test } from 'node:test';
import assert from 'node:assert';

function clampPan(pan, zoom, containerWidth = 600, containerHeight = 200) {
  if (zoom <= 1.0) return { x: 0, y: 0 };
  const maxX = ((zoom - 1) * containerWidth) / 2;
  const maxY = ((zoom - 1) * containerHeight) / 2;
  return {
    x: Math.min(maxX, Math.max(-maxX, pan.x)),
    y: Math.min(maxY, Math.max(-maxY, pan.y)),
  };
}

function computeZoom(currentZoom, delta) {
  return Math.min(4.0, Math.max(1.0, Number((currentZoom + delta).toFixed(2))));
}

test('Hair Strand Macro Studio Zoom - Bounds and Clamping', () => {
  // Test lower and upper bounds
  assert.strictEqual(computeZoom(1.0, -0.5), 1.0, 'Cannot zoom out past 1.0x');
  assert.strictEqual(computeZoom(4.0, 0.5), 4.0, 'Cannot zoom in past 4.0x');
  assert.strictEqual(computeZoom(1.0, 1.0), 2.0, 'Stepping by 1.0 reaches 2.0x');

  // Test pan at 1.0x resets to center
  const centerPan = clampPan({ x: 50, y: -30 }, 1.0);
  assert.deepStrictEqual(centerPan, { x: 0, y: 0 }, 'Pan must be (0,0) at 1.0x zoom');

  // Test pan bounds at 2.0x zoom on 600x200 container
  const maxAt2x = clampPan({ x: 9999, y: 9999 }, 2.0, 600, 200);
  assert.strictEqual(maxAt2x.x, 300, 'Max pan X at 2x should be 300px');
  assert.strictEqual(maxAt2x.y, 100, 'Max pan Y at 2x should be 100px');

  const minAt2x = clampPan({ x: -9999, y: -9999 }, 2.0, 600, 200);
  assert.strictEqual(minAt2x.x, -300, 'Min pan X at 2x should be -300px');
  assert.strictEqual(minAt2x.y, -100, 'Min pan Y at 2x should be -100px');
});

test('Hair Strand Macro Studio Zoom - Presets and Magnification Mapping', () => {
  const presets = [1.0, 2.0, 3.0, 4.0];
  const expectedLabels = ['100x Optical View', '200x Optical View', '300x Optical View', '400x Optical View'];

  presets.forEach((lvl, idx) => {
    const opticalLabel = `${Math.round(lvl * 100)}x Optical View`;
    assert.strictEqual(opticalLabel, expectedLabels[idx]);
  });
});
