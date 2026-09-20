// Board definitions: baked geometry, matrix map, zip round-trip, def-driven import.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const defSrc = fs.readFileSync(path.join(DIR, 'public/js/board-def.js'), 'utf8');
const importSrc = fs.readFileSync(path.join(DIR, 'public/js/vil-import.js'), 'utf8');
const VIL_PATH = '/Users/nikolalakic/Downloads/corne_layout.vil';
const VIL = fs.existsSync(VIL_PATH) ? fs.readFileSync(VIL_PATH, 'utf8') : 'null';

const driver = `
const vil = ${VIL};
let __fails = 0;
function eq(got, want, msg) {
  const a = JSON.stringify(got), b = JSON.stringify(want);
  if (a !== b) { __fails++; console.log('FAIL', msg, '\\n  got: ', a, '\\n  want:', b); }
  else console.log('ok  ', msg);
}
eq(DEF_CORNE46.keys.length, 46, 'DEF46 has 46 keys');
eq(DEF_CORNE42.keys.length, 42, 'DEF42 has 42 keys');
const mp46 = matrixPosMap(DEF_CORNE46);
eq([mp46['0,6'], mp46['1,6'], mp46['4,6'], mp46['5,6']], ['L06', 'L16', 'R06', 'R16'], 'extras at matrix col 6');
eq([mp46['4,5'], mp46['4,0']], ['R00', 'R05'], 'right mirrored: col5=inner R00');
eq([mp46['7,5'], mp46['7,4'], mp46['7,3']], ['RT0', 'RT1', 'RT2'], 'right thumbs');
eq([mp46['3,3'], mp46['3,4'], mp46['3,5']], ['LT0', 'LT1', 'LT2'], 'left thumbs');
eq(mp46['0,0'], 'L00', 'matrix origin = L00');
const b46 = defBounds(DEF_CORNE46);
eq([b46.w, b46.h], [15, 4.7], 'board bounds 15 x 4.7 units');
const at = (pos) => DEF_CORNE46.keys.find(k => k.pos === pos);
eq([at('L03').x, at('L03').y], [3, 0], 'L03 top of stagger');
eq([at('L06').x, at('L06').y], [6, 0.7], 'extra key dropped lower');
eq([at('LT2').x, at('LT2').y, at('LT2').h], [6, 3.2, 1.5], 'tall inner thumb');
// zip round-trip: strip pos, re-derive, must reproduce
const stripped = DEF_CORNE46.keys.map(({ pos, ...rest }) => rest);
const zipped = assignCanonicalPos(stripped);
const zp = {};
zipped.forEach(k => { zp[k.m[0] + ',' + k.m[1]] = k.pos; });
let mism = 0;
DEF_CORNE46.keys.forEach(k => { if (zp[k.m[0] + ',' + k.m[1]] !== k.pos) { mism++; console.log('  zip mismatch', k.m); } });
eq(mism, 0, 'zip round-trip reproduces all 46 assignments');
eq(zipped.length, 46, 'zip assigns all keys');
const stripped42 = DEF_CORNE42.keys.map(({ pos, ...rest }) => rest);
eq(assignCanonicalPos(stripped42).length, 42, 'zip handles 42-key def');
// parser on a small foreign sample
const sample = { keyboard_name: 'demo', layouts: { LAYOUT_test: { layout: [
  { matrix: [0, 0], x: 0, y: 0 }, { matrix: [0, 1], x: 1, y: 0 },
  { matrix: [1, 0], x: 0, y: 1 }, { matrix: [1, 1], x: 1, y: 1 },
] } } };
const parsed = parseInfoJson(sample);
eq(parsed.layouts.length, 1, 'parser finds layout');
eq(parsed.layouts[0].keys.length, 4, 'parser reads 4 keys');
if (vil) {
  store = { layers: [], layerNames: [], variant: 'custom', customDef: { ...DEF_CORNE46, name: 'test/ex2' } };
  const r = vilImport(vil);
  eq(r.ok, true, 'def import ok');
  eq(store.layers.length, 4, '4 layers via def');
  const K = store.layers[0].keys;
  eq([K.L01.output, K.R00.output, K.R06.output, K.RT0.output], ['q', 'y', 'Delete', 'Backspace'], 'def-mapped Q/Y/DEL/BSPC');
  eq([K.L06.output, K.L16.label], ['Escape', 'Opt'], 'def-mapped extras');
  eq(store.variant, 'custom', 'custom variant preserved');
} else { console.log('skip: real .vil fixture not present'); }
globalThis.__testFails = __fails;
`;

const stubs = `let store = { layers: [], layerNames: [], variant: 'corne42' };
let editLayer = 0, activeLayer = 0, baseLayer = 0;
function save() {}
function boot() {}
`;
eval(stubs + defSrc + importSrc + driver);
if (globalThis.__testFails) { console.error(globalThis.__testFails + ' FAILURES'); process.exit(1); }
console.log('board-def suite passed');
