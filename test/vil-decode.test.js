// Keycode decoder unit tests + synthetic import shapes (matrix / visual rows).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = fs.readFileSync(path.join(DIR, 'public/js/vil-import.js'), 'utf8');

const driver = `
let __fails = 0;
function eq(got, want, msg) {
  const a = JSON.stringify(got), b = JSON.stringify(want);
  if (a !== b) { __fails++; console.log('FAIL', msg, '\\n  got: ', a, '\\n  want:', b); }
  else console.log('ok  ', msg);
}
const U = [];
eq(vilDecode('KC_A', [], U), { label: 'A', output: 'a', type: 'print' }, 'KC_A');
eq(vilDecode('KC_SPC', [], U), { label: 'Spc', output: ' ', type: 'special' }, 'KC_SPC');
eq(vilDecode('MO(1)', [], U), { label: 'MO1', output: '', type: 'layer-hold', layer: 1 }, 'MO(1)');
eq(vilDecode('LT(2,KC_SPC)', [], U), { label: 'Spc', output: ' ', type: 'layer-hold', layer: 2 }, 'LT(2,KC_SPC)');
eq(vilDecode('LT2(KC_ENT)', [], U), { label: 'Enter', output: 'Enter', type: 'layer-hold', layer: 2 }, 'LT2(KC_ENT)');
eq(vilDecode('LSFT(KC_1)', [], U), { label: '!', output: '!', type: 'print' }, 'LSFT(KC_1) -> !');
eq(vilDecode('LCTL_T(KC_A)', [], U), { label: 'A', output: 'a', type: 'print' }, 'mod-tap');
eq(vilDecode('LCTL(KC_C)', [], U).type, 'special', 'LCTL(KC_C) special');
eq(vilDecode('KC_TRNS', [], U), { trans: true }, 'transparent');
eq(vilDecode(-1, [], U), null, 'gap -1');
eq(vilDecode('KC_NO', [], U), null, 'gap KC_NO');
eq(vilDecode('TD(0)', [['KC_ESC', 'KC_LCTL', '', '', 200]], U), { label: 'Esc', output: 'Escape', type: 'special' }, 'tap-dance tap slot');
eq(vilDecode('M3', [], U), { label: 'M3', output: '', type: 'special' }, 'macro');
eq(vilDecode('TG(2)', [], U), { label: 'TG2', output: '', type: 'special' }, 'toggle layer');
eq(vilDecode('RGB_TOG', [], U).label, 'RGB', 'rgb');
eq(vilDecode('KC_MUTE', [], U).type, 'special', 'media');

// visual full-width form: 12-wide rows, right half stored mirrored (outer->inner,
// as real split firmware matrices run) — display un-mirrors it back
store = { layers: [], layerNames: [], variant: 'corne42' };
const visualVil = { layout: [[
  ['KC_TAB','KC_Q','KC_W','KC_E','KC_R','KC_T','KC_BSPC','KC_P','KC_O','KC_I','KC_U','KC_Y'],
  ['KC_ESC','KC_A','KC_S','KC_D','KC_F','KC_G','KC_QUOT','KC_SCLN','KC_L','KC_K','KC_J','KC_H'],
  ['KC_LSFT','KC_Z','KC_X','KC_C','KC_V','KC_B','KC_RSFT','KC_SLSH','KC_DOT','KC_COMMA','KC_M','KC_N'],
  ['KC_LCTL','MO(1)','KC_SPC','KC_LGUI','MO(2)','KC_ENT'],
]] };
let r = vilImport(visualVil);
eq(r.ok, true, 'visual import ok');
eq(store.layers[0].keys['L01'], { label: 'Q', output: 'q', type: 'print' }, 'visual L01 = Q');
eq(store.layers[0].keys['R00'], { label: 'Y', output: 'y', type: 'print' }, 'visual R00 = Y');
eq(store.layers[0].keys['R05'], { label: 'Bksp', output: 'Backspace', type: 'special' }, 'visual R05 = Bksp (outer)');
eq(store.layers[0].keys['RT0'], { label: 'Enter', output: 'Enter', type: 'special' }, 'visual RT0 = Enter');
eq(store.layers[0].keys['LT2'], { label: 'Spc', output: ' ', type: 'special' }, 'visual LT2 = Spc');
globalThis.__testFails = __fails;
`;

const stubs = `let store = { layers: [], layerNames: [], variant: 'corne42' };
let editLayer = 0, activeLayer = 0, baseLayer = 0;
function save() {}
function boot() {}
`;
eval(stubs + src + driver);
if (globalThis.__testFails) { console.error(globalThis.__testFails + ' FAILURES'); process.exit(1); }
console.log('decoder suite passed');
