/* Phím & Phím — js/midi.js
 * Ghi file MIDI chuẩn (SMF type 0) để kéo thả vào Piano roll của FL Studio.
 */
(function (global) {
  'use strict';

  const PPQ = 480; // số tick cho mỗi phách (nốt đen)

  function vlq(n) {
    const bytes = [n & 0x7f];
    n >>= 7;
    while (n > 0) { bytes.unshift((n & 0x7f) | 0x80); n >>= 7; }
    return bytes;
  }
  function u32(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]; }
  function u16(n) { return [(n >>> 8) & 255, n & 255]; }
  function ascii(str) {
    const out = [];
    for (const ch of String(str)) { const c = ch.charCodeAt(0); out.push(c < 128 ? c : 63); }
    return out;
  }

  /**
   * notes: [{ midi, start (phách), dur (phách), vel (1–127) }]
   * opts:  { bpm, name, timeSig: [4, 4] }
   */
  function build(notes, opts) {
    opts = opts || {};
    const bpm = opts.bpm || 100;
    const [num, den] = opts.timeSig || [4, 4];
    const ev = [];
    notes.forEach(n => {
      const on = Math.round(n.start * PPQ);
      const off = Math.round((n.start + n.dur) * PPQ) - 1;
      const midi = Math.max(0, Math.min(127, Math.round(n.midi)));
      const vel = Math.max(1, Math.min(127, Math.round(n.vel || 90)));
      ev.push({ t: on, order: 1, data: [0x90, midi, vel] });
      ev.push({ t: Math.max(on + 1, off), order: 0, data: [0x80, midi, 64] });
    });
    ev.sort((a, b) => a.t - b.t || a.order - b.order);

    const track = [];
    const name = ascii(opts.name || 'Phim & Phim');
    track.push(0, 0xff, 0x03, ...vlq(name.length), ...name);
    const mpqn = Math.round(60000000 / bpm);
    track.push(0, 0xff, 0x51, 0x03, (mpqn >> 16) & 255, (mpqn >> 8) & 255, mpqn & 255);
    track.push(0, 0xff, 0x58, 0x04, num, Math.log2(den) | 0, 24, 8);
    let last = 0;
    ev.forEach(e => {
      track.push(...vlq(e.t - last), ...e.data);
      last = e.t;
    });
    track.push(0, 0xff, 0x2f, 0x00);

    const header = [...ascii('MThd'), ...u32(6), ...u16(0), ...u16(1), ...u16(PPQ)];
    const trk = [...ascii('MTrk'), ...u32(track.length), ...track];
    return new Uint8Array(header.concat(trk));
  }

  function download(bytes, filename) {
    const blob = new Blob([bytes], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace(/[^\w\-.#]+/g, '_');
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  const Midi = { PPQ, build, download };
  if (typeof module !== 'undefined' && module.exports) module.exports = Midi;
  else global.Midi = Midi;
})(typeof window !== 'undefined' ? window : globalThis);
