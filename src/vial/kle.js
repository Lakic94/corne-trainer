// SPDX-License-Identifier: GPL-2.0-or-later
// KLE layout parser — ported to plain JS from vialite's kleSerial.ts
// (itself ported from vial-gui's kle_serial.py, based on ijprest/kle-serial).
// Only what the trainer needs: geometry (x/y/w/h + rotation), matrix legend
// (labels[0] = "row,col"), layout-option legend (labels[8]), encoder flag.

// prettier-ignore
const LABEL_MAP = [
  [ 0, 6, 2, 8, 9,11, 3, 5, 1, 4, 7,10], // 0 = no centering
  [ 1, 7,-1,-1, 9,11, 4,-1,-1,-1,-1,10], // 1 = center x
  [ 3,-1, 5,-1, 9,11,-1,-1, 4,-1,-1,10], // 2 = center y
  [ 4,-1,-1,-1, 9,11,-1,-1,-1,-1,-1,10], // 3 = center x & y
  [ 0, 6, 2, 8,10,-1, 3, 5, 1, 4, 7,-1], // 4 = center front (default)
  [ 1, 7,-1,-1,10,-1, 4,-1,-1,-1,-1,-1], // 5 = center front & x
  [ 3,-1, 5,-1,10,-1,-1,-1, 4,-1,-1,-1], // 6 = center front & y
  [ 4,-1,-1,-1,10,-1,-1,-1,-1,-1,-1,-1], // 7 = center front & x & y
];

function reorderLabelsIn(labels, align) {
  const ret = new Array(12).fill(null);
  for (let i = 0; i < labels.length; i++) {
    if (labels[i]) {
      const dest = LABEL_MAP[align][i];
      if (dest >= 0) ret[dest] = labels[i];
    }
  }
  return ret;
}

class MutableKey {
  constructor() {
    this.x = 0; this.y = 0; this.width = 1; this.height = 1;
    this.x2 = 0; this.y2 = 0; this.width2 = 1; this.height2 = 1;
    this.rotationX = 0; this.rotationY = 0; this.rotationAngle = 0;
    this.decal = false;
  }
  clone() { return Object.assign(new MutableKey(), this); }
}

export function deserialize(rows) {
  const current = new MutableKey();
  const clusterOrigin = { x: 0, y: 0 };
  const keys = [];
  let align = 4;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue; // keyboard metadata object — not needed
    for (let k = 0; k < row.length; k++) {
      const item = row[k];
      if (typeof item === 'string') {
        const n = current.clone();
        n.width2 = current.width2 === 0 ? current.width : current.width2;
        n.height2 = current.height2 === 0 ? current.height : current.height2;
        keys.push({
          labels: reorderLabelsIn(item.split('\n'), align),
          x: n.x, y: n.y, width: n.width, height: n.height,
          x2: n.x2, y2: n.y2, width2: n.width2, height2: n.height2,
          rotationX: n.rotationX, rotationY: n.rotationY,
          rotationAngle: n.rotationAngle, decal: n.decal,
        });
        current.x += current.width;
        current.width = current.height = 1;
        current.x2 = current.y2 = current.width2 = current.height2 = 0;
        current.decal = false;
      } else {
        const p = item;
        if ('r' in p) current.rotationAngle = p.r;
        if ('rx' in p) { current.rotationX = clusterOrigin.x = p.rx; current.x = clusterOrigin.x; current.y = clusterOrigin.y; }
        if ('ry' in p) { current.rotationY = clusterOrigin.y = p.ry; current.x = clusterOrigin.x; current.y = clusterOrigin.y; }
        if ('a' in p) align = p.a;
        if ('x' in p) current.x += p.x;
        if ('y' in p) current.y += p.y;
        if ('w' in p) current.width = current.width2 = p.w;
        if ('h' in p) current.height = current.height2 = p.h;
        if ('x2' in p) current.x2 = p.x2;
        if ('y2' in p) current.y2 = p.y2;
        if ('w2' in p) current.width2 = p.w2;
        if ('h2' in p) current.height2 = p.h2;
        if ('d' in p) current.decal = p.d;
      }
    }
    current.y += 1;
    current.x = current.rotationX;
  }
  return { keys };
}

/* A KLE key is a Vial matrix key when its top-left legend reads "row,col". */
export function matrixOf(kleKey) {
  const s = kleKey.labels && kleKey.labels[0];
  if (typeof s !== 'string') return null;
  const m = s.split(',');
  if (m.length !== 2) return null;
  const r = parseInt(m[0], 10), c = parseInt(m[1], 10);
  if (!Number.isInteger(r) || !Number.isInteger(c)) return null;
  return [r, c];
}

export function isEncoder(kleKey) {
  return kleKey.labels && kleKey.labels[4] === 'e';
}

export function layoutTag(kleKey) {
  const s = kleKey.labels && kleKey.labels[8];
  if (typeof s !== 'string' || !s.includes(',')) return null;
  const [a, b] = s.split(',');
  const i = parseInt(a, 10), o = parseInt(b, 10);
  if (!Number.isInteger(i) || !Number.isInteger(o)) return null;
  return [i, o];
}
