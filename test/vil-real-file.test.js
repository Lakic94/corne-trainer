// End-to-end import of the real 46-key Corne .vil (user-local fixture).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = fs.readFileSync(path.join(DIR, 'public/js/vil-import.js'), 'utf8');
const VIL_PATH = '/Users/nikolalakic/Downloads/corne_layout.vil';
if (!fs.existsSync(VIL_PATH)) {
  console.log('skip: real .vil fixture not present at ' + VIL_PATH);
  process.exit(0);
}
const VIL = fs.readFileSync(VIL_PATH, 'utf8');

const driver = `
const vil = ${VIL};
let __fails = 0;
function eq(got, want, msg) {
  const a = JSON.stringify(got), b = JSON.stringify(want);
  if (a !== b) { __fails++; console.log('FAIL', msg, '\\n  got: ', a, '\\n  want:', b); }
  else console.log('ok  ', msg);
}
const r = vilImport(vil);
console.log('MSG:\\n' + r.msg + '\\n');
eq(r.ok, true, 'import ok');
eq(store.layers.length, 4, '4 layers kept (2 empty skipped)');
eq(store.variant, 'corne46', '46-key variant detected');
const L0 = store.layers[0].keys;
eq([L0.L01.label, L0.L01.output], ['Q', 'q'], 'L01 = Q');
eq([L0.L00.label, L0.L00.output], ['Tab', 'Tab'], 'L00 = Tab');
eq([L0.L10.label, L0.L10.output], ['Esc', 'Escape'], 'L10 = mod-tap Esc');
eq([L0.L20.label, L0.L20.type], ['Shift', 'mod'], 'L20 = Shift mod');
eq([L0.L06.label, L0.L06.output], ['Esc', 'Escape'], 'L06 inner extra = Esc');
eq(L0.L16.label, 'Opt', 'L16 inner extra = Alt');
eq([L0.R00.label, L0.R00.output], ['Y', 'y'], 'R00 = Y (mirrored)');
eq([L0.R05.label, L0.R05.output], ['-', '-'], 'R05 = Minus (outer)');
eq([L0.R10.label, L0.R10.output], ['H', 'h'], 'R10 = H');
eq([L0.R15.label, L0.R15.output], ["'", "'"], 'R15 = Quote (outer)');
eq([L0.R06.label, L0.R06.output], ['Del', 'Delete'], 'R06 inner extra = Del');
eq([L0.R16.label, L0.R16.output], ['=', '='], 'R16 inner extra = =');
eq([L0.LT0.label, L0.LT1.label, L0.LT2.label], ['\\u2318', 'MO1', 'Spc'], 'left thumbs');
eq(L0.LT1.type, 'layer-hold', 'LOWER is layer-hold');
eq(L0.LT1.layer, 1, 'LOWER -> layer 1');
eq([L0.RT0.label, L0.RT0.output], ['Bksp', 'Backspace'], 'RT0 inner = Bksp');
eq([L0.RT1.label, L0.RT1.type, L0.RT1.layer], ['Enter', 'layer-hold', 2], 'RT1 = LT2(Enter)');
eq(L0.RT2.label, 'Opt', 'RT2 outer = RAlt');
const L1 = store.layers[1].keys;
eq([L1.L10.label, L1.L10.output], ['Esc', 'Escape'], 'L1 TRNS inherits base Esc-tap');
eq([L1.R25.label, L1.R25.type], ['Shift', 'mod'], 'L1 R25 TRNS inherits RSFT');
eq([L1.R22.label, L1.R22.output], ['_', '_'], 'L1 LSFT(MINUS) -> _');
eq([L1.L11.label, L1.L11.output], ['!', '!'], 'L1 LSFT(1) -> !');
eq([L1.L00.label, L1.L00.output], ['\\\`', '\\\`'], 'L1 L00 = grave');
const L2 = store.layers[2].keys;
eq(L2.R10.label, '\\u25C0', 'L2 arrows land on inner-right home');
eq(L2.R12.label, '\\u25B2', 'L2 up arrow');
eq(L2.L00.label, 'F1', 'L2 F-keys');
const L3 = store.layers[3].keys;
eq(L3.L00.label, 'Reset', 'L3 QK_BOOT');
eq(L3.R10.label, 'Vol-', 'L3 media cluster mirrored');
eq(L3.R12.label, 'Vol+', 'L3 Vol+ position');
globalThis.__testFails = __fails;
`;

const stubs = `let store = { layers: [], layerNames: [], variant: 'corne42' };
let editLayer = 0, activeLayer = 0, baseLayer = 0;
function save() {}
function boot() {}
`;
eval(stubs + src + driver);
if (globalThis.__testFails) { console.error(globalThis.__testFails + ' FAILURES'); process.exit(1); }
console.log('real-file suite passed');
