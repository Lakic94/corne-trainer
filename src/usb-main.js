// SPDX-License-Identifier: GPL-2.0-or-later
// USB entry point (bundled module). Classic app scripts in public/js/ stay
// globals-based; this module bridges USB-loaded boards into them via window.
import { decompress } from 'xz-decompress';

window.CorneUSB = {
  ready: true,
  decompress,
  status: 'stub — USB handshake lands in Phase B',
};
console.log('[corne-trainer] usb module loaded (stub)');
