/* .vil importer — Vial saves JSON under the .vil extension.
   layout = [ layer, ... ], layer = [ row, ... ], row = [ "KC_A", "MO(1)", -1, ... ]
   Maps layers onto our 42 Corne positions, auto-detecting row layout. */

function vilNormalize(kc) {
  return VIL_ALIASES[kc] || kc;
}
const VIL_ALIASES = {
  KC_BSPACE: 'KC_BSPC', KC_ESCAPE: 'KC_ESC', KC_ENTER: 'KC_ENT', KC_SPACE: 'KC_SPC',
  KC_DELETE: 'KC_DEL', KC_INSERT: 'KC_INS', KC_CAPSLOCK: 'KC_CAPS',
  KC_LCTRL: 'KC_LCTL', KC_LSHIFT: 'KC_LSFT', KC_RCTRL: 'KC_RCTL', KC_RSHIFT: 'KC_RSFT',
  KC_LALT: 'KC_LALT', KC_RALT: 'KC_RALT', KC_LGUI: 'KC_LGUI', KC_RGUI: 'KC_RGUI',
  KC_LCMD: 'KC_LGUI', KC_RCMD: 'KC_RGUI', KC_LWIN: 'KC_LGUI', KC_RWIN: 'KC_RGUI',
  KC_PSCREEN: 'KC_PSCR', KC_SCROLLLOCK: 'KC_SLCK', KC_PAUSE: 'KC_PAUS',
  KC_PGDOWN: 'KC_PGDN', KC_PAGEUP: 'KC_PGUP', KC_RIGHT: 'KC_RGHT',
  KC_MINUS: 'KC_MINS', KC_EQUAL: 'KC_EQL', KC_LBRACKET: 'KC_LBRC',
  KC_RBRACKET: 'KC_RBRC', KC_BSLASH: 'KC_BSLS', KC_SCOLON: 'KC_SCLN',
  KC_QUOTE: 'KC_QUOT', KC_GRAVE: 'KC_GRV', KC_COMMA: 'KC_COMM', KC_SLASH: 'KC_SLSH',
  KC_DOT: 'KC_DOT', KC_APPLICATION: 'KC_APP', KC_NUMLOCK: 'KC_NLCK',
  KC_KP_SLASH: 'KC_PSLS', KC_KP_ASTERISK: 'KC_PAST', KC_KP_MINUS: 'KC_PMNS',
  KC_KP_PLUS: 'KC_PPLS', KC_KP_ENTER: 'KC_PENT', KC_KP_DOT: 'KC_PDOT',
  KC_KP_COMMA: 'KC_PCMM', KC_KP_EQUAL: 'KC_PEQL',
  KC_KP_1: 'KC_P1', KC_KP_2: 'KC_P2', KC_KP_3: 'KC_P3', KC_KP_4: 'KC_P4',
  KC_KP_5: 'KC_P5', KC_KP_6: 'KC_P6', KC_KP_7: 'KC_P7', KC_KP_8: 'KC_P8',
  KC_KP_9: 'KC_P9', KC_KP_0: 'KC_P0',
};

/* base table: canonical short name -> {label, output, type} */
const VIL_KC = {};
(function buildKC() {
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(ch => {
    VIL_KC['KC_' + ch] = { label: ch, output: ch.toLowerCase(), type: 'print' };
  });
  const put = (n, label, output, type) => { VIL_KC[n] = { label, output, type }; };
  [['KC_1', '1'], ['KC_2', '2'], ['KC_3', '3'], ['KC_4', '4'], ['KC_5', '5'],
   ['KC_6', '6'], ['KC_7', '7'], ['KC_8', '8'], ['KC_9', '9'], ['KC_0', '0']
  ].forEach(([n, d]) => put(n, d, d, 'print'));
  // punctuation (unshifted output)
  [['KC_MINS', '-', '-'], ['KC_EQL', '=', '='], ['KC_LBRC', '[', '['], ['KC_RBRC', ']', ']'],
   ['KC_BSLS', '\\', '\\'], ['KC_SCLN', ';', ';'], ['KC_QUOT', "'", "'"], ['KC_GRV', '`', '`'],
   ['KC_COMM', ',', ','], ['KC_DOT', '.', '.'], ['KC_SLSH', '/', '/'],
   // shifted names (in case firmware uses them)
   ['KC_EXLM', '!', '!'], ['KC_AT', '@', '@'], ['KC_HASH', '#', '#'], ['KC_DLR', '$', '$'],
   ['KC_PERC', '%', '%'], ['KC_CIRC', '^', '^'], ['KC_AMPR', '&', '&'], ['KC_ASTR', '*', '*'],
   ['KC_LPRN', '(', '('], ['KC_RPRN', ')', ')'], ['KC_UNDS', '_', '_'], ['KC_PLUS', '+', '+'],
   ['KC_LCBR', '{', '{'], ['KC_RCBR', '}', '}'], ['KC_PIPE', '|', '|'], ['KC_COLN', ':', ':'],
   ['KC_DQT', '"', '"'], ['KC_TILD', '~', '~'], ['KC_LABK', '<', '<'], ['KC_RABK', '>', '>'],
   ['KC_QUES', '?', '?'],
   // whitespace / editing
   ['KC_SPC', 'Spc', ' ', 'special'], ['KC_TAB', 'Tab', 'Tab', 'special'],
   ['KC_ENT', 'Enter', 'Enter', 'special'], ['KC_BSPC', 'Bksp', 'Backspace', 'special'],
   ['KC_ESC', 'Esc', 'Escape', 'special'], ['KC_DEL', 'Del', 'Delete', 'special'],
   ['KC_CAPS', 'Caps', 'CapsLock', 'special'], ['KC_INS', 'Ins', 'Insert', 'special'],
   ['KC_HOME', 'Home', 'Home', 'special'], ['KC_END', 'End', 'End', 'special'],
   ['KC_PGUP', 'PgUp', 'PageUp', 'special'], ['KC_PGDN', 'PgDn', 'PageDown', 'special'],
   ['KC_PSCR', 'PrtSc', 'PrintScreen', 'special'], ['KC_SLCK', 'ScrLk', 'ScrollLock', 'special'],
   ['KC_PAUS', 'Pause', 'Pause', 'special'], ['KC_APP', 'Menu', 'ContextMenu', 'special'],
   ['KC_NLCK', 'Num', '', 'special'], ['KC_GESC', 'Esc', 'Escape', 'special'],
   // arrows
   ['KC_LEFT', '◀', 'ArrowLeft', 'special'], ['KC_RGHT', '▶', 'ArrowRight', 'special'],
   ['KC_UP', '▲', 'ArrowUp', 'special'], ['KC_DOWN', '▼', 'ArrowDown', 'special'],
   // modifiers
   ['KC_LCTL', 'Ctrl', 'Control', 'mod'], ['KC_LSFT', 'Shift', 'Shift', 'mod'],
   ['KC_LALT', 'Opt', 'Alt', 'mod'], ['KC_LGUI', '⌘', 'Meta', 'mod'],
   ['KC_RCTL', 'Ctrl', 'Control', 'mod'], ['KC_RSFT', 'Shift', 'Shift', 'mod'],
   ['KC_RALT', 'Opt', 'Alt', 'mod'], ['KC_RGUI', '⌘', 'Meta', 'mod'],
   // space-cadet / shifted-tap parens
   ['KC_LSPO', '(', '(', 'print'], ['KC_RSPC', ')', ')', 'print'],
   ['KC_LCPO', '(', '(', 'print'], ['KC_RCPC', ')', ')', 'print'],
   ['KC_LAPO', '(', '(', 'print'], ['KC_RAPC', ')', ')', 'print'],
   ['KC_SFTENT', 'S-Ent', 'Enter', 'special'],
   // keypad
   ['KC_P1', '1', '1', 'print'], ['KC_P2', '2', '2', 'print'], ['KC_P3', '3', '3', 'print'],
   ['KC_P4', '4', '4', 'print'], ['KC_P5', '5', '5', 'print'], ['KC_P6', '6', '6', 'print'],
   ['KC_P7', '7', '7', 'print'], ['KC_P8', '8', '8', 'print'], ['KC_P9', '9', '9', 'print'],
   ['KC_P0', '0', '0', 'print'], ['KC_PSLS', '/', '/', 'print'], ['KC_PAST', '*', '*', 'print'],
   ['KC_PMNS', '-', '-', 'print'], ['KC_PPLS', '+', '+', 'print'], ['KC_PDOT', '.', '.', 'print'],
   ['KC_PCMM', ',', ',', 'print'], ['KC_PEQL', '=', '=', 'print'],
   ['KC_PENT', 'NumEnt', 'Enter', 'special'],
   // media
   ['KC_MUTE', 'Mute', '', 'special'], ['KC_VOLD', 'Vol-', '', 'special'], ['KC_VOLU', 'Vol+', '', 'special'],
   ['KC_MPRV', 'Prev', '', 'special'], ['KC_MNXT', 'Next', '', 'special'], ['KC_MPLY', 'Play', '', 'special'],
   ['KC_MSTP', 'Stop', '', 'special'], ['KC_MRWD', 'Rew', '', 'special'], ['KC_MFFD', 'FF', '', 'special'],
   ['KC_EJCT', 'Eject', '', 'special'], ['KC_BRIU', 'Bri+', '', 'special'], ['KC_BRID', 'Bri-', '', 'special'],
   ['KC_AUDIO_MUTE', 'Mute', '', 'special'], ['KC_AUDIO_VOL_DOWN', 'Vol-', '', 'special'],
   ['KC_AUDIO_VOL_UP', 'Vol+', '', 'special'], ['KC_MEDIA_PREV_TRACK', 'Prev', '', 'special'],
   ['KC_MEDIA_NEXT_TRACK', 'Next', '', 'special'], ['KC_MEDIA_PLAY_PAUSE', 'Play', '', 'special'],
   ['KC_MEDIA_STOP', 'Stop', '', 'special'], ['KC_MEDIA_REWIND', 'Rew', '', 'special'],
   ['KC_MEDIA_FAST_FORWARD', 'FF', '', 'special'], ['KC_MEDIA_EJECT', 'Eject', '', 'special'],
   ['KC_BRIGHTNESS_UP', 'Bri+', '', 'special'], ['KC_BRIGHTNESS_DOWN', 'Bri-', '', 'special'],
   // system / apps
   ['KC_PWR', 'Power', '', 'special'], ['KC_SLEP', 'Sleep', '', 'special'], ['KC_WAKE', 'Wake', '', 'special'],
   ['KC_CALC', 'Calc', '', 'special'], ['KC_MAIL', 'Mail', '', 'special'],
   // rgb / backlight / misc firmware keys
   ['RGB_TOG', 'RGB', '', 'special'], ['RGB_MOD', 'RGB+', '', 'special'], ['RGB_RMOD', 'RGB-', '', 'special'],
   ['RGB_HUI', 'Hue+', '', 'special'], ['RGB_HUD', 'Hue-', '', 'special'],
   ['RGB_SAI', 'Sat+', '', 'special'], ['RGB_SAD', 'Sat-', '', 'special'],
   ['RGB_VAI', 'Bri+', '', 'special'], ['RGB_VAD', 'Bri-', '', 'special'],
   ['RGB_SPI', 'Fx+', '', 'special'], ['RGB_SPD', 'Fx-', '', 'special'],
   ['RESET', 'Reset', '', 'special'], ['DEBUG', 'Debug', '', 'special'], ['EE_CLR', 'EEClr', '', 'special'],
   ['QK_BOOT', 'Reset', '', 'special'],
  ].forEach(([n, label, output, type]) => put(n, label, output, type || 'print'));
  for (let i = 1; i <= 24; i++) put('KC_F' + i, 'F' + i, 'F' + i, 'special');
})();

const VIL_SHIFT_MAP = { '1': '!', '2': '@', '3': '#', '4': '$', '5': '%', '6': '^', '7': '&', '8': '*', '9': '(', '0': ')', '-': '_', '=': '+', '[': '{', ']': '}', '\\': '|', ';': ':', "'": '"', '`': '~', ',': '<', '.': '>', '/': '?' };
const VIL_MOD_SHORT = { LCTL: 'C', RCTL: 'C', LALT: 'A', RALT: 'A', LGUI: 'G', RGUI: 'G', LSFT: 'S', RSFT: 'S', C: 'C', S: 'S', A: 'A', G: 'G', MEH: 'Meh', HYPR: 'Hyp' };

/* decode one keycode string -> {label,output,type,layer} | {trans:true} | null(gap) ; unknowns recorded */
function vilDecode(kc, tapDance, unknowns, depth) {
  if (kc === null || kc === undefined || kc === '' || kc === -1 || kc === 0) return null;
  if (typeof kc === 'number') return vilDecodeInt(kc, unknowns);
  kc = String(kc).trim();
  if (kc === '' || kc === 'KC_NO') return null;
  if (kc === 'KC_TRNS' || kc === 'KC_TRANSPARENT' || kc === '▽') return { trans: true };
  depth = depth || 0;

  let m;
  // layer keys: MO(1) TG(2) TO(0) TT(1) DF(0) OSL(1)
  if ((m = kc.match(/^(MO|TG|TO|TT|DF|OSL)\((\d+)\)$/))) {
    const n = +m[2];
    if (m[1] === 'MO') return { label: 'MO' + n, output: '', type: 'layer-hold', layer: n };
    return { label: m[1] + n, output: '', type: 'special' };
  }
  // layer-tap: LT(2,KC_SPC) or LT2(KC_SPC)
  if ((m = kc.match(/^(?:LT(\d)\(|LT\((\d+),\s*)(.+)\)$/))) {
    const n = +(m[1] || m[2]);
    const inner = vilDecode(m[3], tapDance, unknowns, depth + 1);
    if (!inner || inner.trans) return { label: 'MO' + n, output: '', type: 'layer-hold', layer: n };
    return { label: inner.label, output: inner.output, type: 'layer-hold', layer: n };
  }
  // mod-tap: LCTL_T(KC_A), C_S_T(...), MT(MOD_LCTL,KC_A)
  if ((m = kc.match(/^(\w+)_T\((.+)\)$/) || kc.match(/^MT\(([^,]+),\s*(.+)\)$/))) {
    const real = vilDecode(m[2], tapDance, unknowns, depth + 1);
    if (!real || real.trans) return { label: (m[1] || 'MT'), output: '', type: 'special' };
    return { label: real.label, output: real.output, type: real.type === 'print' ? 'print' : 'special' };
  }
  // one-shot mod: OSM(MOD_LSFT) etc
  if (/^OSM\(/.test(kc)) return { label: 'OSM', output: '', type: 'special' };
  // shifted: LSFT(KC_1) -> !
  if ((m = kc.match(/^([LR]SFT)\((.+)\)$/))) {
    const inner = vilDecode(m[2], tapDance, unknowns, depth + 1);
    if (inner && inner.output && inner.output.length === 1) {
      const shifted = VIL_SHIFT_MAP[inner.output] || inner.output.toUpperCase();
      return { label: shifted, output: shifted, type: 'print' };
    }
    return { label: 'S+' + ((inner && inner.label) || m[2]), output: '', type: 'special' };
  }
  // tap dance: TD(3) -> use tap slot (before generic pair branch: TD(x) would match it)
  if ((m = kc.match(/^TD\((\d+)\)$/))) {
    const td = (tapDance || [])[+m[1]];
    if (td && td[0] && depth < 3) {
      const t = vilDecode(td[0], tapDance, unknowns, depth + 1);
      if (t && !t.trans) return t;
    }
    return { label: 'TD' + m[1], output: '', type: 'special' };
  }
  // macros M0..M15, combos C0..
  if (/^M(\d{1,2})$/.test(kc)) return { label: kc, output: '', type: 'special' };
  if (/^C(\d+)$/.test(kc)) return { label: kc, output: '', type: 'special' };
  // other mod-wraps: LCTL(KC_C), C_S(KC_X), MEH(...), LCAG(...) ...
  if ((m = kc.match(/^([A-Z0-9_]+)\((.*)\)$/))) {
    const inner = vilDecode(m[2], tapDance, unknowns, depth + 1);
    const pre = VIL_MOD_SHORT[m[1]] || m[1].slice(0, 3);
    return { label: pre + '+' + ((inner && inner.label) || '?'), output: '', type: 'special' };
  }

  const norm = vilNormalize(kc);
  const hit = VIL_KC[norm];
  if (hit) return { label: hit.label, output: hit.output, type: hit.type };
  // prefix groups: RGB_*, BL_*, AU_*, MAGIC_*, MI_*, DYN_*, CMB_*, HPT_*
  const pre = kc.split('_')[0];
  if (['RGB', 'BL', 'AU', 'MAGIC', 'MI', 'DYN', 'CMB', 'HPT'].includes(pre))
    return { label: pre === 'RGB' ? 'RGB' : pre, output: '', type: 'special' };
  if (kc.startsWith('KC_')) {
    unknowns.push(kc);
    return { label: kc.slice(3, 11), output: '', type: 'special' };
  }
  unknowns.push(kc);
  return { label: kc.slice(0, 10), output: '', type: 'special' };
}

/* best-effort numeric (VIA-style) keycode decode */
function vilDecodeInt(kc, unknowns) {
  if (kc === 0 || kc === -1) return null;
  if (kc === 1) return { trans: true };
  if (kc >= 4 && kc <= 29) {
    const ch = String.fromCharCode(61 + kc);
    return { label: ch, output: ch.toLowerCase(), type: 'print' };
  }
  const B = { 30: '1', 31: '2', 32: '3', 33: '4', 34: '5', 35: '6', 36: '7', 37: '8', 38: '9', 39: '0', 44: ' ', 45: '-', 46: '=', 47: '[', 48: ']', 49: '\\', 51: ';', 52: "'", 53: '`', 54: ',', 55: '.', 56: '/', 40: 'Enter', 41: 'Escape', 42: 'Backspace', 43: 'Tab', 57: 'CapsLock', 79: '▶', 80: '◀', 81: '▼', 82: '▲', 74: 'Home', 77: 'End', 75: 'PageUp', 78: 'PageDown', 73: 'Insert', 76: 'Delete', 224: 'Ctrl', 225: 'Shift', 226: 'Opt', 227: '⌘', 228: 'Ctrl', 229: 'Shift', 230: 'Opt', 231: '⌘' };
  if (B[kc] !== undefined) {
    const v = B[kc];
    if (/^[a-z0-9 \-\=\[\]\\;\',\.\/`]$/.test(v)) return { label: v === ' ' ? 'Spc' : v, output: v, type: v === ' ' ? 'special' : 'print' };
    if (['▶', '◀', '▲', '▼'].includes(v)) return { label: v, output: '', type: 'special' };
    if (['Ctrl', 'Shift', 'Opt', '⌘'].includes(v)) return { label: v, output: '', type: 'mod' };
    if (/^F?\d*$/.test(v) || v.length <= 2) return { label: v, output: v, type: 'print' };
    return { label: v.slice(0, 6), output: v, type: 'special' };
  }
  if (kc >= 58 && kc <= 69) return { label: 'F' + (kc - 57), output: '', type: 'special' };
  if (kc >= 0x4000 && kc <= 0x4fff) { // LT
    const base = vilDecodeInt(kc & 0xff, unknowns);
    return { label: (base && base.label) || ('MO' + ((kc >> 8) & 15)), output: (base && base.output) || '', type: 'layer-hold', layer: (kc >> 8) & 15 };
  }
  if (kc >= 0x6000 && kc <= 0x7fff) { // MT
    const base = vilDecodeInt(kc & 0xff, unknowns);
    if (base && !base.trans) return { label: base.label, output: base.output, type: base.type === 'print' ? 'print' : 'special' };
    return { label: 'MT', output: '', type: 'special' };
  }
  if (kc >= 0x5100 && kc <= 0x51ff) { const n = kc - 0x5100; return { label: 'MO' + n, output: '', type: 'layer-hold', layer: n }; }
  if (kc >= 0x5000 && kc <= 0x501f) return { label: 'TO' + (kc - 0x5000), output: '', type: 'special' };
  if (kc >= 0x5220 && kc <= 0x523f) return { label: 'TG' + (kc - 0x5220), output: '', type: 'special' };
  if (kc >= 0x5240 && kc <= 0x525f) return { label: 'OSL' + (kc - 0x5240), output: '', type: 'special' };
  if (kc >= 0x5800 && kc <= 0x58ff) return { label: 'TT' + (kc - 0x5800), output: '', type: 'special' };
  if (kc >= 0x5700 && kc <= 0x57ff) return { label: 'TD' + (kc - 0x5700), output: '', type: 'special' };
  if (kc >= 0x7700 && kc <= 0x77ff) return { label: 'M' + (kc - 0x7700), output: '', type: 'special' };
  if (kc >= 0x0100 && kc <= 0x1fff) {
    const mods = (kc & 0x1f00) >> 8, base = vilDecodeInt(kc & 0xff, unknowns);
    if (mods === 0x02 && base && base.output && base.output.length === 1) {
      const s = VIL_SHIFT_MAP[base.output] || base.output.toUpperCase();
      return { label: s, output: s, type: 'print' };
    }
    return { label: '+' + ((base && base.label) || '?'), output: '', type: 'special' };
  }
  unknowns.push('0x' + kc.toString(16));
  return { label: '0x' + kc.toString(16).slice(-4), output: '', type: 'special' };
}

/* ---- positional mapping: matrix cols stay put, right half mirrored ----
   .vil rows follow the firmware matrix: rows 0-3 = left half, 4-7 = right.
   Split PCBs are usually wired mirrored, so right rows run outer->inner
   and are flipped for display (inner->outer). 7-wide rows carry an inner
   extra key (46-key boards); gaps (-1 / KC_NO) keep their position so
   sparse layers (arrows, RGB...) land correctly. */
function vilPosIds() {
  const ids = [];
  for (const side of ['L', 'R']) {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) ids.push(side + r + c);
    for (let t = 0; t < 3; t++) ids.push(side + 'T' + t);
  }
  ['L06', 'L16', 'R06', 'R16'].forEach(p => ids.push(p));
  return ids; // 46
}
function vilPad7(row) {
  const r = [...(Array.isArray(row) ? row : [])];
  while (r.length < 7) r.push('');
  return r.slice(0, 7);
}
/* one 7-wide half-row (stored outer->inner). display: L outer->inner, R inner->outer */
function vilHalfMap(r, mirror, isRight) {
  const d = mirror ? [...r].reverse() : [...r];
  if (isRight && mirror) return { main: d.slice(1, 7), extra: d[0] }; // inner extra lands first
  return { main: d.slice(0, 6), extra: d[6] };
}
/* thumb row: real keys at matrix cols 3,4,5 (stored outer->inner) */
function vilThumbMap(row, mirror) {
  const r = vilPad7(row);
  const t = [r[3], r[4], r[5]];
  return mirror ? [...t].reverse() : t;
}
function vilEntry(e, tapDance, unknowns) {
  const d = vilDecode(e, tapDance, unknowns, 0);
  if (!d) return { label: '', output: '', type: 'print' };
  if (d.trans) return { trans: true };
  return { label: String(d.label).slice(0, 10), output: d.output || '', type: d.type, layer: d.layer };
}
/* matrix form: 8 rows (left half rows 0-3, right half 4-7) */
function vilMapMatrixLayer(rows, mirrorL, mirrorR, tapDance, unknowns, dropped) {
  const keys = {};
  const L = [0, 1, 2, 3].map(i => vilPad7(rows[i]));
  const R = [4, 5, 6, 7].map(i => vilPad7(rows[i]));
  for (let r = 0; r < 3; r++) {
    const lm = vilHalfMap(L[r], mirrorL, false), rm = vilHalfMap(R[r], mirrorR, true);
    lm.main.forEach((e, c) => { keys['L' + r + c] = vilEntry(e, tapDance, unknowns); });
    rm.main.forEach((e, c) => { keys['R' + r + c] = vilEntry(e, tapDance, unknowns); });
    keys['L' + r + '6'] = vilEntry(lm.extra, tapDance, unknowns);
    keys['R' + r + '6'] = vilEntry(rm.extra, tapDance, unknowns);
    if (r === 2) ['L26', 'R26'].forEach(p => { // no bottom-extra slot on this board: report & drop
      const d = keys[p];
      if (d && !d.trans && (d.label || d.output)) dropped.push(d.label || d.output);
      delete keys[p];
    });
  }
  vilThumbMap(L[3], mirrorL).forEach((e, t) => { keys['LT' + t] = vilEntry(e, tapDance, unknowns); });
  vilThumbMap(R[3], mirrorR).forEach((e, t) => { keys['RT' + t] = vilEntry(e, tapDance, unknowns); });
  return keys;
}
/* visual full-width form: 4 rows (12-wide = 42-key, 14-wide = 46-key) */
function vilMapVisualLayer(rows, mirrorL, mirrorR, tapDance, unknowns) {
  const keys = {};
  for (let r = 0; r < 3; r++) {
    const row = [...(Array.isArray(rows[r]) ? rows[r] : [])];
    const w = Math.ceil(row.length / 2);
    const lm = vilHalfMap(vilPad7(row.slice(0, w)), mirrorL, false);
    const rm = vilHalfMap(vilPad7(row.slice(w, w * 2)), mirrorR, true);
    lm.main.forEach((e, c) => { keys['L' + r + c] = vilEntry(e, tapDance, unknowns); });
    rm.main.forEach((e, c) => { keys['R' + r + c] = vilEntry(e, tapDance, unknowns); });
    keys['L' + r + '6'] = vilEntry(lm.extra, tapDance, unknowns);
    keys['R' + r + '6'] = vilEntry(rm.extra, tapDance, unknowns);
    if (r === 2) ['L26', 'R26'].forEach(p => delete keys[p]);
  }
  const th = [...(Array.isArray(rows[3]) ? rows[3] : [])];
  const w = Math.ceil(th.length / 2);
  const Lt = [...th.slice(0, w), '', '', ''].slice(0, 3), Rt = [...th.slice(w, w * 2), '', '', ''].slice(0, 3);
  (mirrorL ? [...Lt].reverse() : Lt).forEach((e, t) => { keys['LT' + t] = vilEntry(e, tapDance, unknowns); });
  (mirrorR ? [...Rt].reverse() : Rt).forEach((e, t) => { keys['RT' + t] = vilEntry(e, tapDance, unknowns); });
  return keys;
}
/* last resort: flat key list, left half first */
function vilMapFlatLayer(all, tapDance, unknowns) {
  const keys = {};
  const chunks = all.length >= 46 ? [7, 7, 6, 3] : [6, 6, 6, 3];
  const perHalf = chunks[0] + chunks[1] + chunks[2] + chunks[3];
  const L = all.slice(0, perHalf), R = all.slice(perHalf, perHalf * 2);
  const take = (arr, i, n) => { const s = arr.slice(i, i + n); while (s.length < n) s.push(''); return s; };
  let li = 0, ri = 0;
  for (let r = 0; r < 3; r++) {
    const lc = take(L, li, chunks[r]); li += chunks[r];
    if (lc.length === 7) {
      lc.slice(0, 6).forEach((e, c) => { keys['L' + r + c] = vilEntry(e, tapDance, unknowns); });
      keys['L' + r + '6'] = vilEntry(lc[6], tapDance, unknowns);
    } else lc.forEach((e, c) => { keys['L' + r + c] = vilEntry(e, tapDance, unknowns); });
    let rc = take(R, ri, chunks[r]); ri += chunks[r];
    rc = [...rc].reverse();
    if (chunks[r] === 7) {
      keys['R' + r + '6'] = vilEntry(rc[0], tapDance, unknowns);
      rc.slice(1).forEach((e, c) => { keys['R' + r + c] = vilEntry(e, tapDance, unknowns); });
    } else rc.forEach((e, c) => { keys['R' + r + c] = vilEntry(e, tapDance, unknowns); });
  }
  take(L, li, 3).forEach((e, t) => { keys['LT' + t] = vilEntry(e, tapDance, unknowns); });
  [...take(R, ri, 3)].reverse().forEach((e, t) => { keys['RT' + t] = vilEntry(e, tapDance, unknowns); });
  vilPosIds().forEach(p => { if (!keys[p]) keys[p] = { label: '', output: '', type: 'print' }; });
  return keys;
}
function vilImport(parsed) {
  const tapDance = parsed.tap_dance || [];
  let vilLayers = null, form = 'matrix';
  if (Array.isArray(parsed.layout) && parsed.layout.length) {
    const l0 = parsed.layout[0];
    if (Array.isArray(l0) && l0.length && l0.some(Array.isArray)) {
      vilLayers = parsed.layout;
      form = l0.length === 8 ? 'matrix' : (l0.length === 4 ? 'visual' : 'flatlayers');
    } else if (Array.isArray(l0)) { vilLayers = parsed.layout; form = 'flatlayers'; }
  }
  if (!vilLayers && Array.isArray(parsed.layers) && parsed.layers.length && parsed.layers[0] && !parsed.layers[0].keys) {
    vilLayers = parsed.layers; form = 'flatlayers'; // VIA-style numeric backup
  }
  if (!vilLayers) return { ok: false, msg: 'No key layers found in this file.' };
  vilLayers = vilLayers.slice(0, 16);
  const unknowns = [], dropped = [];

  // custom board: map matrix slots straight through the board definition (deterministic, no guessing)
  if (typeof store !== 'undefined' && store.variant === 'custom' && store.customDef && Array.isArray(store.customDef.keys)) {
    return vilImportViaDef(parsed, vilLayers);
  }

  const mapWith = (layer, mL, mR, dropArr) => {
    if (layer.length === 8 && layer.some(Array.isArray)) return vilMapMatrixLayer(layer, mL, mR, tapDance, unknowns, dropArr);
    if (layer.length === 4 && layer.some(Array.isArray)) return vilMapVisualLayer(layer, mL, mR, tapDance, unknowns);
    const flat = Array.isArray(layer) ? layer.flat(Infinity) : [];
    const sq = flat.filter(e => e !== -1 && e !== 'KC_NO' && e !== 0 && e !== '');
    return vilMapFlatLayer(sq, tapDance, unknowns);
  };

  // split halves are wired mirrored on Corne-likes: fixed mapping, with the
  // manual ⇄ Mirror button in the UI for oddballs (no QWERTY guessing)
  const mL = false, mR = true;

  const rawLayers = vilLayers.map(layer => mapWith(layer, mL, mR, dropped));
  return vilCommit(rawLayers, { detectVariant: true, mirrorNote: (mR ? 'mirrored' : 'as-stored'), unknowns, dropped });
}

/* shared tail: skip empties, resolve transparent, name, store, report */
function vilCommit(rawLayers, opts) {
  opts = opts || {};
  const kept = [], skippedIdx = [];
  rawLayers.forEach((keys, i) => {
    const has = Object.values(keys).some(d => d && !d.trans && (d.label || d.output));
    if (has) kept.push(keys); else skippedIdx.push(i);
  });
  if (!kept.length) return { ok: false, msg: 'All layers in this file are empty.' };

  const posIds = vilPosIds();
  const layers = kept.map(keys => ({ keys }));
  // resolve transparent: inherit layer 0
  let resolved = 0;
  layers.forEach((L, li) => {
    if (li === 0) {
      posIds.forEach(pos => { if (L.keys[pos] && L.keys[pos].trans) L.keys[pos] = { label: '', output: '', type: 'print' }; });
      return;
    }
    posIds.forEach(pos => {
      if (L.keys[pos] && L.keys[pos].trans) {
        L.keys[pos] = { ...(layers[0].keys[pos] || { label: '', output: '', type: 'print' }) };
        resolved++;
      }
    });
  });

  const names = opts.names || layers.map((_, i) =>
    layers.length === 4 ? ['Base', 'Lower · nums', 'Raise · nav', 'Adjust'][i] : 'Layer ' + i);

  store.layers = layers;
  store.layerNames = names;
  let head = opts.head || 'imported';
  if (opts.detectVariant) {
    const isX = p => p === 'L06' || p === 'L16' || p === 'R06' || p === 'R16';
    const extraUsed = posIds.some(p => isX(p) && layers.some(L => { const d = L.keys[p]; return d && (d.label || d.output); }));
    store.variant = extraUsed ? 'corne46' : 'corne42';
    head = (extraUsed ? '46-key board' : '42-key board') + ', right half ' + (opts.mirrorNote || 'as-stored');
  }
  save();
  if (typeof editLayer !== 'undefined') { editLayer = 0; }
  activeLayer = 0; baseLayer = 0;
  boot();

  const uniqUnknown = [...new Set(opts.unknowns || [])].slice(0, 10);
  let msg = 'Imported ' + layers.length + ' layers from .vil ✓ (' + head + ')';
  if (skippedIdx.length) msg += '\nSkipped empty layer' + (skippedIdx.length > 1 ? 's' : '') + ' ' + skippedIdx.join(', ') + '.';
  if (resolved) msg += '\n' + resolved + ' transparent (▽) keys filled from base layer.';
  if ((opts.dropped || []).length) msg += '\n' + opts.dropped.length + ' key(s) had no home on this board: ' + [...new Set(opts.dropped)].slice(0, 6).join(', ');
  if (uniqUnknown.length) msg += '\nUnknown keycodes kept as labels: ' + uniqUnknown.join(', ');
  msg += '\nCheck the Layout tab — fix anything odd, then type!';
  return { ok: true, msg };
}

/* custom-board import: matrix slots resolve through the loaded board definition */
function vilImportViaDef(parsed, vilLayers) {
  const tapDance = parsed.tap_dance || [];
  const unknowns = [];
  const mp = matrixPosMap(store.customDef);
  const posIds = vilPosIds();
  const rawLayers = vilLayers.map(layer => {
    const keys = {};
    posIds.forEach(p => { keys[p] = { label: '', output: '', type: 'print' }; });
    (Array.isArray(layer) ? layer : []).forEach((row, r) => {
      if (!Array.isArray(row)) return;
      row.forEach((e, c) => {
        const pos = mp[r + ',' + c];
        if (pos) keys[pos] = vilEntry(e, tapDance, unknowns);
      });
    });
    return keys;
  });
  return vilCommit(rawLayers, { unknowns, head: 'via board definition (' + (store.customDef.name || 'custom') + ')' });
}

/* entry point wired from app.js file picker */
function importBackupFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (parsed.layers && parsed.layerNames && parsed.layers[0] && parsed.layers[0].keys) {
        // our own backup
        store = parsed; save(); boot();
        alert('Backup restored ✓');
      } else {
        // assume Vial .vil (or VIA backup)
        const r = vilImport(parsed);
        alert(r.msg);
        if (r.ok) {
          document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('active', x.dataset.tab === 'layout'));
          document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x.id === 'tab-layout'));
        }
      }
    } catch (err) { alert('Could not read that file (' + err.message + '). Export a .vil from Vial: File → Save current layout.'); }
  };
  reader.readAsText(file);
}
