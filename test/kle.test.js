// KLE parser: geometry, rotation clusters, matrix legends, layout tags, encoders.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deserialize, matrixOf, isEncoder, layoutTag } from '../src/vial/kle.js';

describe('kle', () => {
  it('parses basic rows with stagger offsets', () => {
    const kb = deserialize([
      [{ x: 0 }, '0,0', '0,1'],
      ['1,0', { w: 2 }, '1,1'],
    ]);
    assert.equal(kb.keys.length, 4);
    assert.deepEqual([kb.keys[0].x, kb.keys[0].y], [0, 0]);
    assert.deepEqual([kb.keys[1].x, kb.keys[1].y], [1, 0]);
    assert.deepEqual([kb.keys[2].x, kb.keys[2].y], [0, 1]);
    assert.equal(kb.keys[3].width, 2);
    assert.deepEqual([kb.keys[3].x, kb.keys[3].y], [1, 1]);
  });

  it('handles rotation clusters (thumb splay)', () => {
    const kb = deserialize([
      [{ rx: 8, ry: 3, r: 30 }, '7,5', '7,4'],
    ]);
    assert.equal(kb.keys.length, 2);
    assert.equal(kb.keys[0].rotationAngle, 30);
    assert.equal(kb.keys[0].rotationX, 8);
    assert.equal(kb.keys[0].rotationY, 3);
    assert.deepEqual(matrixOf(kb.keys[0]), [7, 5]);
  });

  it('resets rotation when a new cluster starts', () => {
    const kb = deserialize([
      [{ rx: 8, ry: 3, r: 30 }, '7,5'],
      [{ rx: 0, ry: 0, r: 0 }, '0,0'],
    ]);
    assert.equal(kb.keys[1].rotationAngle, 0);
  });

  it('reads matrix legends, layout tags, encoders; skips decals', () => {
    const kb = deserialize([
      ['0,0', { d: true }, 'deco', { a: 0 }, '0,1\n\n\n0,1'],
    ]);
    assert.equal(kb.keys.length, 3);
    assert.deepEqual(matrixOf(kb.keys[0]), [0, 0]);
    assert.equal(kb.keys[1].decal, true);
    assert.deepEqual(matrixOf(kb.keys[2]), [0, 1]);
    assert.equal(layoutTag(kb.keys[2]).join(','), '0,1');
    assert.equal(isEncoder(kb.keys[0]), false);
    // encoder flag: 'e' on the 10th legend line lands on labels[4] (vial-gui semantics)
    const enc = deserialize([['0,0\n\n\n\n\n\n\n\n\ne']]);
    assert.equal(isEncoder(enc.keys[0]), true);
    assert.equal(matrixOf({ labels: ['nope'] }), null);
    assert.equal(matrixOf({ labels: [] }), null);
  });
});
