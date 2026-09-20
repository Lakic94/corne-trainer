// SPDX-License-Identifier: GPL-2.0-or-later
// XZ decompression for Vial definition blobs. The WASM decoder ships
// base64-inlined inside the xz-decompress package, so this works bundled,
// hosted, and (unlike fetch-based WASM) from file:// too.
import xz from 'xz-decompress';

const { XzReadableStream } = xz;

export async function xzDecompress(bytes) {
  const stream = new XzReadableStream(new Blob([bytes]).stream());
  const chunks = [];
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}
