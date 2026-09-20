/* Board definitions: matrix slot -> physical geometry.
   Baked from the official crkbd rev4.1 info.json (Vial-QMK firmware repo):
   - DEF_CORNE46 = LAYOUT_split_3x6_3_ex2  (the "Corne v4.1" 46-key: +2 inner extras)
   - DEF_CORNE42 = LAYOUT_split_3x6_3      (standard 42-key Corne)
   Entry: {pos, m:[row,col], x, y, w, h} in KLE units.
   Custom boards: parse any QMK info.json and zip its geometry onto our
   canonical pos scheme (see assignCanonicalPos). */
function defExpand(id, extras, rows) {
  // rows: [pos, matrixRow, matrixCol, x, y, w, h]
  return { id, extras, custom: false, keys: rows.map(r => ({ pos: r[0], m: [r[1], r[2]], x: r[3], y: r[4], w: r[5] || 1, h: r[6] || 1 })) };
}
const DEF_CORNE46 = defExpand('corne46', true, [
  ['L00',0,0, 0,0.3],['L01',0,1, 1,0.3],['L02',0,2, 2,0.1],['L03',0,3, 3,0],['L04',0,4, 4,0.1],['L05',0,5, 5,0.2],['L06',0,6, 6,0.7],
  ['L10',1,0, 0,1.3],['L11',1,1, 1,1.3],['L12',1,2, 2,1.1],['L13',1,3, 3,1],['L14',1,4, 4,1.1],['L15',1,5, 5,1.2],['L16',1,6, 6,1.7],
  ['L20',2,0, 0,2.3],['L21',2,1, 1,2.3],['L22',2,2, 2,2.1],['L23',2,3, 3,2],['L24',2,4, 4,2.1],['L25',2,5, 5,2.2],
  ['LT0',3,3, 4,3.7],['LT1',3,4, 5,3.7],['LT2',3,5, 6,3.2, 1,1.5],
  ['R06',4,6, 8,0.7],['R00',4,5, 9,0.2],['R01',4,4, 10,0.1],['R02',4,3, 11,0],['R03',4,2, 12,0.1],['R04',4,1, 13,0.3],['R05',4,0, 14,0.3],
  ['R16',5,6, 8,1.7],['R10',5,5, 9,1.2],['R11',5,4, 10,1.1],['R12',5,3, 11,1],['R13',5,2, 12,1.1],['R14',5,1, 13,1.3],['R15',5,0, 14,1.3],
  ['R20',6,5, 9,2.2],['R21',6,4, 10,2.1],['R22',6,3, 11,2],['R23',6,2, 12,2.1],['R24',6,1, 13,2.3],['R25',6,0, 14,2.3],
  ['RT0',7,5, 8,3.2, 1,1.5],['RT1',7,4, 9,3.7],['RT2',7,3, 10,3.7],
]);
const DEF_CORNE42 = defExpand('corne42', false, [
  ['L00',0,0, 0,0.3],['L01',0,1, 1,0.3],['L02',0,2, 2,0.1],['L03',0,3, 3,0],['L04',0,4, 4,0.1],['L05',0,5, 5,0.2],
  ['L10',1,0, 0,1.3],['L11',1,1, 1,1.3],['L12',1,2, 2,1.1],['L13',1,3, 3,1],['L14',1,4, 4,1.1],['L15',1,5, 5,1.2],
  ['L20',2,0, 0,2.3],['L21',2,1, 1,2.3],['L22',2,2, 2,2.1],['L23',2,3, 3,2],['L24',2,4, 4,2.1],['L25',2,5, 5,2.2],
  ['LT0',3,3, 4,3.7],['LT1',3,4, 5,3.7],['LT2',3,5, 6,3.2, 1,1.5],
  ['R00',4,5, 9,0.2],['R01',4,4, 10,0.1],['R02',4,3, 11,0],['R03',4,2, 12,0.1],['R04',4,1, 13,0.3],['R05',4,0, 14,0.3],
  ['R10',5,5, 9,1.2],['R11',5,4, 10,1.1],['R12',5,3, 11,1],['R13',5,2, 12,1.1],['R14',5,1, 13,1.3],['R15',5,0, 14,1.3],
  ['R20',6,5, 9,2.2],['R21',6,4, 10,2.1],['R22',6,3, 11,2],['R23',6,2, 12,2.1],['R24',6,1, 13,2.3],['R25',6,0, 14,2.3],
  ['RT0',7,5, 8,3.2, 1,1.5],['RT1',7,4, 9,3.7],['RT2',7,3, 10,3.7],
]);

function activeDef() {
  if (typeof store !== 'undefined' && store.variant === 'custom' && store.customDef && Array.isArray(store.customDef.keys)) return store.customDef;
  if (typeof store !== 'undefined' && store.variant === 'corne42') return DEF_CORNE42;
  return DEF_CORNE46;
}
function hasExtras() { return activeDef().extras === true; }
function activePosList() {
  const inDef = new Set(activeDef().keys.map(k => k.pos));
  return POS.filter(p => inDef.has(p));
}
function matrixPosMap(def) {
  const map = {};
  def.keys.forEach(k => { map[k.m[0] + ',' + k.m[1]] = k.pos; });
  return map;
}
function defBounds(def) {
  let w = 0, h = 0;
  def.keys.forEach(k => { w = Math.max(w, k.x + (k.w || 1)); h = Math.max(h, k.y + (k.h || 1)); });
  return { w, h };
}

/* canonical slot geometry (for mapping foreign boards onto our pos scheme) */
function canonicalSlots() {
  const slots = [];
  const push = (pos, half, x, y) => slots.push({ pos, half, x, y });
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 6; c++) push('L' + r + c, 0, c, r);
    push('L' + r + '6', 0, 6, r);
    push('R' + r + '6', 1, 8, r);
    for (let c = 0; c < 6; c++) push('R' + r + c, 1, 9 + c, r);
  }
  push('LT0', 0, 4, 3); push('LT1', 0, 5, 3); push('LT2', 0, 6, 3);
  push('RT0', 1, 8, 3); push('RT1', 1, 9, 3); push('RT2', 1, 10, 3);
  return slots;
}

/* parse a QMK info.json -> {name, layouts:[{name, keys:[{m,x,y,w,h}]}]} */
function parseInfoJson(infoJson) {
  const out = { name: infoJson.keyboard_name || infoJson.keyboard || 'custom board', layouts: [] };
  const layouts = infoJson.layouts || {};
  for (const [lname, l] of Object.entries(layouts)) {
    if (!l || !Array.isArray(l.layout)) continue;
    const keys = [];
    for (const e of l.layout) {
      if (!e || !Array.isArray(e.matrix)) continue;
      keys.push({ m: [e.matrix[0], e.matrix[1]], x: +e.x || 0, y: +e.y || 0, w: +(e.w || 1), h: +(e.h || 1) });
    }
    if (keys.length) out.layouts.push({ name: lname, keys });
  }
  return out;
}

/* zip foreign geometry onto canonical pos ids.
   Groups keys by firmware matrix row (QMK numbers rows top-to-bottom per half),
   orders groups by height, orders keys left-to-right, and zips with the
   canonical slots. Pure y-banding can't work (stagger overlaps row bands),
   but matrix rows are exact. deterministic. */
function assignCanonicalPos(defKeys) {
  const slots = canonicalSlots();
  const xs = [...new Set(defKeys.map(k => k.x))].sort((a, b) => a - b);
  let gapIdx = 1, gapMax = -1;
  for (let i = 1; i < xs.length; i++) { const g = xs[i] - xs[i - 1]; if (g > gapMax) { gapMax = g; gapIdx = i; } }
  let cut;
  if (xs.length > 1 && gapMax >= 1.5) cut = (xs[gapIdx - 1] + xs[gapIdx]) / 2;
  else { const s = [...defKeys].sort((a, b) => a.x - b.x); cut = s.length ? s[Math.floor(s.length / 2)].x + 0.01 : 0; }
  const halves = [defKeys.filter(k => k.x < cut), defKeys.filter(k => k.x >= cut)];
  const out = [];
  halves.forEach((half, hi) => {
    const mySlots = [[], [], [], []];
    slots.filter(s => s.half === hi).forEach(s => { mySlots[Math.min(3, Math.round(s.y))].push(s); });
    const groups = new Map();
    half.forEach(k => {
      const r = Array.isArray(k.m) ? k.m[0] : -1;
      if (!groups.has(r)) groups.set(r, []);
      groups.get(r).push(k);
    });
    const ordered = [...groups.values()].sort((a, b) => Math.min(...a.map(k => k.y)) - Math.min(...b.map(k => k.y)));
    ordered.slice(0, 4).forEach((g, si) => {
      const ks = [...g].sort((p, q) => p.x - q.x);
      const ss = [...(mySlots[si] || [])].sort((p, q) => p.x - q.x);
      // nearest free slot wins (a 6-wide def row leaves the extra slot empty, not shifted)
      ks.forEach(k => {
        let bi = -1, bd = 1e9;
        ss.forEach((s, i) => { if (s.used) return; const d = Math.abs(s.x - k.x); if (d < bd) { bd = d; bi = i; } });
        if (bi >= 0) { ss[bi].used = true; out.push({ ...k, pos: ss[bi].pos }); }
      });
    });
  });
  return out;
}
