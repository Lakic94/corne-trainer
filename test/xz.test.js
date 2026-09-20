// XZ definition-blob decompression (vendored dep sanity: node + real .xz bytes).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { xzDecompress } from '../src/vial/xz.js';

describe('xz', () => {
  it('round-trips a python-generated .xz fixture', async () => {
    const DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
    void DIR;
    const xzBytes = new Uint8Array(fs.readFileSync('/tmp/xz-vec.xz'));
    const expected = fs.readFileSync('/tmp/xz-vec.json', 'utf8');
    const t0 = Date.now();
    const out = await xzDecompress(xzBytes);
    const text = new TextDecoder().decode(out);
    assert.equal(text, expected);
    assert.ok(Date.now() - t0 < 5000, 'decodes fast');
    const parsed = JSON.parse(text);
    assert.deepEqual(parsed.matrix, { rows: 2, cols: 2 });
  });
});
