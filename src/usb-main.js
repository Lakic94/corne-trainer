// SPDX-License-Identifier: GPL-2.0-or-later
// USB board loader: reads a Vial board's OWN layout definition + live keymap
// over WebHID (same handshake as vial-gui/vialite: ID -> size -> definition
// blocks -> keymap buffer) and installs them as the active custom board.
// Read-only: no unlock flow, no writes of any kind.
import { HidTransport, VialClient, ProtocolError } from './vial/protocol.js';
import { deserialize, matrixOf, isEncoder } from './vial/kle.js';
import { xzDecompress } from './vial/xz.js';

const IS_EXTRA = (p) => p === 'L06' || p === 'L16' || p === 'R06' || p === 'R16';

function g(name) {
  const v = window[name];
  if (typeof v === 'undefined') throw new Error('app core not loaded (' + name + ')');
  return v;
}

function friendly(err) {
  if (err instanceof ProtocolError) {
    if (err.code === 'webhidUnsupported') return 'WebHID needs Chrome/Edge over https or localhost.';
    if (err.code === 'noDeviceSelected') return 'Cancelled — no device picked.';
    if (err.code === 'commFailed') return 'Board stopped answering. Re-plug it and retry.';
    if (err.code === 'unsupportedProtocol') return err.message + ' — update the board firmware or this app.';
    if (err.code === 'deviceDisconnected') return 'Board was unplugged.';
  }
  return (err && err.message) || String(err);
}

async function connect(onStatus) {
  const say = (m) => { try { onStatus && onStatus(m); } catch { /* noop */ } };
  let transport = null;
  try {
    say('Pick your keyboard in the browser dialog…');
    transport = await HidTransport.request();
    say('Connected: ' + transport.name + ' — downloading its layout definition…');
    const client = new VialClient(transport);
    const info = await client.load();
    say('Definition received — decompressing…');
    const defJson = JSON.parse(new TextDecoder().decode(await xzDecompress(info.blob)));
    const kle = deserialize(defJson.layouts.keymap);
    const entries = [];
    for (const k of kle.keys) {
      if (k.decal || isEncoder(k)) continue;
      const m = matrixOf(k);
      if (!m) continue;
      entries.push({
        m, x: k.x, y: k.y, w: k.width, h: k.height,
        r: k.rotationAngle || 0, rx: k.rotationX, ry: k.rotationY,
      });
    }
    if (!entries.length) throw new Error('no matrix keys in the device definition');
    const assigned = g('assignCanonicalPos')(entries);
    if (!assigned.length) throw new Error('could not map device geometry');
    say(`Geometry mapped (${assigned.length} keys) — pulling ${info.layers} live layers…`);
    const live = await client.loadKeymap(defJson.matrix.rows, defJson.matrix.cols, info.layers);
    const vilDecodeInt = g('vilDecodeInt');
    const mp = {};
    assigned.forEach((k) => { mp[k.m[0] + ',' + k.m[1]] = k; });
    const posIds = g('vilPosIds')();
    const unknowns = [];
    const rawLayers = live.map((layer) => {
      const keys = {};
      posIds.forEach((p) => { keys[p] = { label: '', output: '', type: 'print' }; });
      layer.forEach((row, r) => row.forEach((kc, c) => {
        const slot = mp[r + ',' + c];
        if (!slot || !slot.pos) return;
        const d = vilDecodeInt(kc, unknowns);
        keys[slot.pos] = !d ? { label: '', output: '', type: 'print' }
          : d.trans ? { trans: true }
          : { label: String(d.label).slice(0, 10), output: d.output || '', type: d.type, layer: d.layer };
      }));
      return keys;
    });
    g('setCustomBoard')({
      id: 'usb',
      name: transport.name,
      extras: assigned.some((k) => IS_EXTRA(k.pos)),
      custom: true, usb: true,
      keys: assigned.map((k) => ({ pos: k.pos, m: k.m, x: k.x, y: k.y, w: k.w, h: k.h, r: k.r, rx: k.rx, ry: k.ry })),
    });
    say(`Board installed — importing ${rawLayers.length} live layers…`);
    return g('vilCommit')(rawLayers, { unknowns, head: 'live from USB (' + transport.name + ')' });
  } catch (err) {
    throw new Error(friendly(err));
  } finally {
    if (transport) { try { await transport.close(); } catch { /* noop */ } }
  }
}

window.CorneUSB = { connect };
