// Protocol client against a fake HID device replaying a full handshake.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  HidTransport, VialClient, ProtocolError,
  pktGetDef, pktKeymapBuffer, parseProtocolVersion, parseKeyboardId,
  parseSize, parseLayerCount, checkProtocols,
} from '../src/vial/protocol.js';

const DEF_JSON = JSON.stringify({
  matrix: { rows: 2, cols: 2 },
  layouts: { keymap: [['0,0', '0,1'], ['1,0', '1,1']] },
});
const DEFBYTES = new TextEncoder().encode(DEF_JSON);
// layer0: A B / C D ; layer1: MO(1) TRNS / NO SPC
const KEYMAP = new Uint8Array([0, 4, 0, 5, 0, 6, 0, 7, 0x51, 1, 0, 1, 0, 0, 0, 0x2c]);

function reply32(fill) {
  const b = new Uint8Array(32);
  b.set(fill.slice(0, 32));
  return b;
}

class FakeDevice {
  constructor() {
    this.opened = false;
    this.productName = 'Fake Corne';
    this.handlers = new Set();
  }
  addEventListener(t, h) { if (t === 'inputreport') this.handlers.add(h); }
  removeEventListener(t, h) { if (t === 'inputreport') this.handlers.delete(h); }
  async open() { this.opened = true; }
  async close() { this.opened = false; }
  async sendReport(_id, bytes) {
    const m = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let out;
    if (m[0] === 0x01) out = reply32([0x01, 0x00, 0x09]); // VIA protocol 9
    else if (m[0] === 0xfe && m[1] === 0x00) {
      out = reply32([]); // vialProtocol u32LE=6, keyboardId u64=0x1234
      new DataView(out.buffer).setUint32(0, 6, true);
      new DataView(out.buffer).setBigUint64(4, 0x1234n, true);
    } else if (m[0] === 0xfe && m[1] === 0x01) {
      out = reply32([]); new DataView(out.buffer).setUint32(0, DEFBYTES.length, true);
    } else if (m[0] === 0xfe && m[1] === 0x02) {
      const block = new DataView(m.buffer, m.byteOffset, m.byteLength).getUint32(2, true);
      out = reply32(DEFBYTES.slice(block * 32, block * 32 + 32));
    } else if (m[0] === 0x11) out = reply32([0x00, 0x02]); // 2 layers
    else if (m[0] === 0x12) {
      const off = (m[1] << 8) | m[2], size = m[3];
      out = reply32([0x12, m[1], m[2], size]);
      out.set(KEYMAP.slice(off, off + size), 4);
    } else if (m[0] === 0x02) out = reply32([0, 0, 0, 0, 0, 0]); // layout options 0
    else throw new Error('unexpected command ' + m[0]);
    setTimeout(() => {
      for (const h of [...this.handlers]) h({ data: new DataView(out.buffer) });
    }, 0);
  }
}

class SilentDevice extends FakeDevice {
  async sendReport() { /* never replies */ }
}

describe('protocol packets', () => {
  it('builds exact command bytes', () => {
    assert.deepEqual([...pktGetDef(3)], [0xfe, 0x02, 3, 0, 0, 0]);
    assert.deepEqual([...pktKeymapBuffer(0x123, 28)], [0x12, 0x01, 0x23, 28]);
  });
  it('parses responses', () => {
    assert.equal(parseProtocolVersion(new Uint8Array([1, 0, 9])), 9);
    const id = parseKeyboardId(new Uint8Array([6, 0, 0, 0, 0x34, 0x12, 0, 0, 0, 0, 0, 0]));
    assert.equal(id.vialProtocol, 6);
    assert.equal(id.keyboardId, '1234');
    const sz = new Uint8Array(4); new DataView(sz.buffer).setUint32(0, 91, true);
    assert.equal(parseSize(sz), 91);
    assert.equal(parseLayerCount(new Uint8Array([0, 6])), 6);
    assert.throws(() => checkProtocols(8, 6), /unsupported/);
    checkProtocols(9, 6);
  });
});

describe('protocol handshake', () => {
  it('loads definition blob, keymap and options from a fake board', async () => {
    const t = new HidTransport(new FakeDevice());
    const c = new VialClient(t);
    const info = await c.load();
    assert.equal(info.via, 9);
    assert.equal(info.vialProtocol, 6);
    assert.equal(info.keyboardId, '1234');
    assert.equal(info.layers, 2);
    assert.equal(new TextDecoder().decode(info.blob), DEF_JSON);
    const km = await c.loadKeymap(2, 2, 2);
    assert.deepEqual(km, [[[4, 5], [6, 7]], [[0x5101, 1], [0, 0x2c]]]);
    assert.equal(await c.loadLayoutOptions(), 0);
    await t.close();
  });

  it('fails cleanly when the device never answers', async () => {
    const t = new HidTransport(new SilentDevice());
    await assert.rejects(() => t.send(new Uint8Array([0x01]), 1, 5), (e) => {
      assert.ok(e instanceof ProtocolError);
      return true;
    });
    await t.close();
  });
});
