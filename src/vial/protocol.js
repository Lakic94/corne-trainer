// SPDX-License-Identifier: GPL-2.0-or-later
// Vial/VIA USB protocol client. Constants match vial-gui's protocol/constants.py
// (via vialite's constants.ts); handshake flow mirrors vial-gui's keyboard_comm.py.
// Read-only: definition download + keymap buffer + layout options. No unlock, no writes.
export const CMD_VIA_GET_PROTOCOL_VERSION = 0x01;
export const CMD_VIA_GET_KEYBOARD_VALUE = 0x02;
export const CMD_VIA_GET_LAYER_COUNT = 0x11;
export const CMD_VIA_KEYMAP_GET_BUFFER = 0x12;
export const CMD_VIA_VIAL_PREFIX = 0xfe;
export const VIA_LAYOUT_OPTIONS = 0x02;
export const CMD_VIAL_GET_KEYBOARD_ID = 0x00;
export const CMD_VIAL_GET_SIZE = 0x01;
export const CMD_VIAL_GET_DEFINITION = 0x02;
export const BUFFER_FETCH_CHUNK = 28;
export const MSG_LEN = 32;
export const VIAL_USAGE_PAGE = 0xff60;
export const VIAL_USAGE = 0x61;
export const SUPPORTED_VIA_PROTOCOL = [-1, 9];
export const SUPPORTED_VIAL_PROTOCOL = [-1, 0, 1, 2, 3, 4, 5, 6];

export class ProtocolError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}

/* ---- pure packet builders (single source of truth, unit-tested) ---- */
export const pktPing = () => u8([CMD_VIA_GET_PROTOCOL_VERSION]);
export const pktKeyboardId = () => u8([CMD_VIA_VIAL_PREFIX, CMD_VIAL_GET_KEYBOARD_ID]);
export const pktGetSize = () => u8([CMD_VIA_VIAL_PREFIX, CMD_VIAL_GET_SIZE]);
export function pktGetDef(block) {
  const b = new Uint8Array(6);
  b[0] = CMD_VIA_VIAL_PREFIX; b[1] = CMD_VIAL_GET_DEFINITION;
  new DataView(b.buffer).setUint32(2, block, true);
  return b;
}
export const pktLayerCount = () => u8([CMD_VIA_GET_LAYER_COUNT]);
export function pktKeymapBuffer(offset, size) {
  const b = new Uint8Array(4);
  b[0] = CMD_VIA_KEYMAP_GET_BUFFER;
  new DataView(b.buffer).setUint16(1, offset, false);
  b[3] = size;
  return b;
}
export const pktLayoutOptions = () => u8([CMD_VIA_GET_KEYBOARD_VALUE, VIA_LAYOUT_OPTIONS]);
function u8(arr) { return new Uint8Array(arr); }

/* ---- pure response parsers ---- */
export function parseProtocolVersion(bytes) {
  return (bytes[1] << 8) | bytes[2];
}
export function parseKeyboardId(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { vialProtocol: dv.getUint32(0, true), keyboardId: dv.getBigUint64(4, true).toString(16) };
}
export function parseSize(bytes) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, true);
}
export function parseLayerCount(bytes) { return bytes[1]; }
export function parseLayoutOptions(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return dv.getUint32(2, false);
}
export function checkProtocols(via, vial) {
  if (!SUPPORTED_VIA_PROTOCOL.includes(via) || !SUPPORTED_VIAL_PROTOCOL.includes(vial)) {
    throw new ProtocolError(`unsupported protocol (via=${via}, vial=${vial})`, 'unsupportedProtocol');
  }
}

/* ---- WebHID transport: serialized sends, sequence-matched replies, retries ---- */
export class HidTransport {
  constructor(device) {
    this.device = device;
    this.waiter = null;
    this.sentCount = 0;
    this.recvCount = 0;
    this.chain = Promise.resolve();
    this.dead = false;
    this.onDisconnect = null;
    this._onReport = (e) => this._handle(e);
    this._onHidDrop = (e) => { if (e.device === this.device) this._drop(); };
    device.addEventListener('inputreport', this._onReport);
    if (typeof navigator !== 'undefined' && navigator.hid) {
      navigator.hid.addEventListener('disconnect', this._onHidDrop);
    }
  }
  static async request() {
    if (typeof navigator === 'undefined' || !('hid' in navigator)) {
      throw new ProtocolError('WebHID not available (use Chrome/Edge over https or localhost)', 'webhidUnsupported');
    }
    const devs = await navigator.hid.requestDevice({ filters: [{ usagePage: VIAL_USAGE_PAGE, usage: VIAL_USAGE }] });
    if (!devs.length) throw new ProtocolError('no device selected', 'noDeviceSelected');
    const t = new HidTransport(devs[0]);
    if (!t.device.opened) await t.device.open();
    return t;
  }
  get name() { return this.device.productName || 'keyboard'; }
  _drop() {
    this.dead = true;
    if (this.waiter) { const w = this.waiter; this.waiter = null; w.resolve(null); }
    const cb = this.onDisconnect; this.onDisconnect = null;
    if (cb) cb();
  }
  _handle(e) {
    const data = new Uint8Array(e.data.buffer, e.data.byteOffset, e.data.byteLength);
    this.recvCount += 1;
    if (this.waiter && this.recvCount === this.waiter.expectSeq) {
      const w = this.waiter; this.waiter = null; w.resolve(data);
    }
  }
  send(cmd, retries = 5, timeoutMs = 800) {
    if (cmd.length > MSG_LEN) return Promise.reject(new ProtocolError('message too long', 'commFailed'));
    const msg = new Uint8Array(MSG_LEN);
    msg.set(cmd);
    const run = this.chain.then(() => this._sendOnce(msg, retries, timeoutMs));
    this.chain = run.catch(() => {});
    return run;
  }
  async _sendOnce(msg, retries, timeoutMs) {
    for (let attempt = 0; attempt < retries; attempt++) {
      if (this.dead) throw new ProtocolError('device disconnected', 'deviceDisconnected');
      if (attempt > 0) await sleep(400);
      if (this.recvCount > this.sentCount) this.recvCount = this.sentCount; // resync on stray reports
      const data = await this._attempt(msg, timeoutMs);
      if (data) return data;
    }
    throw new ProtocolError('device stopped answering', 'commFailed');
  }
  _attempt(msg, timeoutMs) {
    return new Promise((resolve) => {
      const waiter = { expectSeq: this.sentCount + 1, resolve: (d) => { clearTimeout(timer); resolve(d); } };
      const timer = setTimeout(() => { if (this.waiter === waiter) this.waiter = null; resolve(null); }, timeoutMs);
      this.waiter = waiter;
      this.sentCount += 1;
      this.device.sendReport(0, msg).catch(() => {
        this.sentCount -= 1;
        if (this.waiter === waiter) this.waiter = null;
        waiter.resolve(null);
      });
    });
  }
  async close() {
    this.dead = true;
    try { this.device.removeEventListener('inputreport', this._onReport); } catch {}
    try {
      if (typeof navigator !== 'undefined' && navigator.hid) {
        navigator.hid.removeEventListener('disconnect', this._onHidDrop);
      }
    } catch {}
    if (this.device.opened) { try { await this.device.close(); } catch {} }
  }
}
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

/* ---- high-level read-only client ---- */
export class VialClient {
  constructor(transport) { this.t = transport; }
  async load() {
    // 1. VIA protocol version
    const v = await this.t.send(pktPing());
    const via = parseProtocolVersion(v);
    // 2. keyboard id (+ vial protocol)
    const id = await this.t.send(pktKeyboardId());
    const { vialProtocol, keyboardId } = parseKeyboardId(id);
    checkProtocols(via, vialProtocol);
    // 3. definition blob
    const sz = await this.t.send(pktGetSize());
    let remaining = parseSize(sz);
    const chunks = [];
    for (let block = 0; remaining > 0; block++) {
      const data = await this.t.send(pktGetDef(block));
      chunks.push(data.slice(0, Math.min(remaining, MSG_LEN)));
      remaining -= MSG_LEN;
    }
    // 4. layer count
    const lc = await this.t.send(pktLayerCount());
    const layers = parseLayerCount(lc);
    return { via, vialProtocol, keyboardId, blob: concat(chunks), layers, name: this.t.name };
  }
  async loadKeymap(rows, cols, layers) {
    const total = layers * rows * cols * 2;
    let buf = new Uint8Array(0);
    for (let off = 0; off < total; off += BUFFER_FETCH_CHUNK) {
      const size = Math.min(total - off, BUFFER_FETCH_CHUNK);
      const data = await this.t.send(pktKeymapBuffer(off, size));
      buf = concat([buf, data.slice(4, 4 + size)]);
    }
    const out = [];
    for (let l = 0; l < layers; l++) {
      const layer = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          const o = (l * rows * cols + r * cols + c) * 2;
          row.push((buf[o] << 8) | buf[o + 1]);
        }
        layer.push(row);
      }
      out.push(layer);
    }
    return out;
  }
  async loadLayoutOptions() {
    const data = await this.t.send(pktLayoutOptions());
    return parseLayoutOptions(data);
  }
}
function concat(parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
