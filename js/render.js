/* Phím & Phím — js/render.js
 * Vẽ bằng SVG: cần đàn, sơ đồ thế bấm, bàn phím piano, vòng quãng 5, piano roll.
 * Màu sắc lấy từ biến CSS nên tự đổi theo giao diện sáng/tối.
 */
(function (global) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, str, attrs) {
    const t = el('text', Object.assign({ x, y }, attrs || {}), parent);
    t.textContent = str;
    return t;
  }
  function labelSize(label, r) {
    const n = [...String(label)].length;
    return n <= 1 ? r * 1.02 : n === 2 ? r * 0.92 : n === 3 ? r * 0.76 : r * 0.64;
  }
  function mount(container, svg) {
    container.innerHTML = '';
    container.appendChild(svg);
    return svg;
  }

  /* ------------------------------------------------------------------ */
  /* Cần đàn                                                             */
  /* ------------------------------------------------------------------ */
  const INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];

  /**
   * o = { tuning, frets, marks: [{ s, f, label, fam, strong, ghost, title }], leftHanded,
   *       window: [from, to], onClick(s, f, midi), stringNames: [...], compact, aria }
   */
  function fretboard(container, o) {
    const nS = o.tuning.length;
    const frets = o.frets || 15;
    const sp = o.compact ? 25 : 30;
    const top = 8, pad = 15;
    const nutX = 50;
    const widths = [];
    let w = o.compact ? 56 : 68;
    for (let f = 1; f <= frets; f++) { widths.push(w); w *= 0.963; }
    const xs = [nutX];
    widths.forEach((ww, i) => xs.push(xs[i] + ww));
    const W = xs[frets] + 12;
    const boardH = sp * (nS - 1) + pad * 2;
    const H = top + boardH + 24;
    const X = x => (o.leftHanded ? W - x : x);
    const y = s => top + pad + (nS - 1 - s) * sp;
    const cellX = f => (f === 0 ? nutX - 22 : (xs[f - 1] + xs[f]) / 2);

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fb' + (o.compact ? ' compact' : ''), role: 'img', 'aria-label': o.aria || 'Cần đàn guitar' });
    svg.style.minWidth = Math.round(W * (o.compact ? 0.62 : 0.7)) + 'px';

    const bx = Math.min(X(nutX), X(xs[frets]));
    el('rect', { x: bx, y: top, width: xs[frets] - nutX, height: boardH, rx: 4, class: 'fb-wood' }, svg);
    el('rect', { x: bx, y: top, width: xs[frets] - nutX, height: 3, class: 'fb-edge' }, svg);
    el('rect', { x: bx, y: top + boardH - 3, width: xs[frets] - nutX, height: 3, class: 'fb-edge' }, svg);

    INLAYS.forEach(f => {
      if (f <= frets) el('circle', { cx: X(cellX(f)), cy: top + boardH / 2, r: o.compact ? 4.5 : 5.5, class: 'fb-inlay' }, svg);
    });
    [12, 24].forEach(f => {
      if (f > frets) return;
      el('circle', { cx: X(cellX(f)), cy: top + boardH / 2 - sp, r: o.compact ? 4.5 : 5.5, class: 'fb-inlay' }, svg);
      el('circle', { cx: X(cellX(f)), cy: top + boardH / 2 + sp, r: o.compact ? 4.5 : 5.5, class: 'fb-inlay' }, svg);
    });

    if (o.window) {
      const [a, b] = o.window;
      const x0 = a <= 0 ? nutX - 40 : xs[a - 1];
      const x1 = xs[Math.min(b, frets)];
      el('rect', { x: Math.min(X(x0), X(x1)), y: top - 4, width: x1 - x0, height: boardH + 8, rx: 6, class: 'fb-window' }, svg);
    }

    for (let f = 1; f <= frets; f++) {
      el('line', { x1: X(xs[f]), y1: top, x2: X(xs[f]), y2: top + boardH, class: 'fb-fret' }, svg);
    }
    el('rect', { x: o.leftHanded ? X(nutX) : X(nutX) - 5, y: top - 1, width: 5, height: boardH + 2, rx: 1.5, class: 'fb-nut' }, svg);

    for (let s = 0; s < nS; s++) {
      const sw = (0.8 + (nS - 1 - s) * 0.34).toFixed(2);
      el('line', { x1: X(nutX - 40), y1: y(s), x2: X(nutX), y2: y(s), class: 'fb-string open', 'stroke-width': sw }, svg);
      el('line', {
        x1: X(nutX), y1: y(s), x2: X(xs[frets]), y2: y(s),
        class: 'fb-string' + (s < Math.ceil(nS / 2) && nS > 4 ? ' wound' : ''), 'stroke-width': sw
      }, svg);
    }

    if (o.stringNames) {
      for (let s = 0; s < nS; s++) {
        txt(svg, X(nutX - 44), y(s) + 3.5, o.stringNames[s], { class: 'fb-sname', 'text-anchor': 'middle' });
      }
    }

    for (let f = 1; f <= frets; f++) {
      const strong = INLAYS.includes(f) || f === 12 || f === 24;
      txt(svg, X(cellX(f)), top + boardH + 16, String(f), { class: 'fb-num' + (strong ? ' strong' : ''), 'text-anchor': 'middle' });
    }

    // Vùng bấm (để nghe từng nốt)
    if (o.onClick) {
      const hit = el('g', { class: 'fb-hit' }, svg);
      for (let s = 0; s < nS; s++) {
        for (let f = 0; f <= frets; f++) {
          const x0 = f === 0 ? nutX - 40 : xs[f - 1];
          const x1 = f === 0 ? nutX : xs[f];
          el('rect', {
            x: Math.min(X(x0), X(x1)), y: y(s) - sp / 2, width: x1 - x0, height: sp,
            'data-s': s, 'data-f': f, fill: 'transparent'
          }, hit);
        }
      }
    }

    const marks = el('g', { class: 'fb-marks' }, svg);
    (o.marks || []).forEach(m => {
      if (m.f > frets) return;
      const base = o.compact ? 9.5 : 11.5;
      const r = m.f === 0 ? base : Math.min(base, widths[m.f - 1] / 2 - 1.5);
      const g = el('g', {
        class: 'mk fam-' + (m.fam || 'none') + (m.strong ? ' strong' : '') + (m.ghost ? ' ghost' : '') + (m.ring ? ' ring' : ''),
        transform: `translate(${X(cellX(m.f)).toFixed(1)},${y(m.s)})`,
        'data-s': m.s, 'data-f': m.f
      }, marks);
      if (m.title) el('title', null, g).textContent = m.title;
      el('circle', { r: r.toFixed(1) }, g);
      if (m.label !== undefined && m.label !== '') {
        txt(g, 0, 0, m.label, { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': labelSize(m.label, r).toFixed(1) });
      }
    });

    if (o.onClick) {
      svg.addEventListener('click', e => {
        const t = e.target.closest('[data-s]');
        if (!t) return;
        const s = +t.getAttribute('data-s'), f = +t.getAttribute('data-f');
        o.onClick(s, f, o.tuning[s] + f);
      });
    }
    return mount(container, svg);
  }

  /* ------------------------------------------------------------------ */
  /* Sơ đồ thế bấm                                                       */
  /* ------------------------------------------------------------------ */
  /** v = { frets, fingers, barre, minF, maxF, ivs }, o = { bottom: [nhãn mỗi dây], fams: [...] } */
  function chordDiagram(v, o) {
    o = o || {};
    const nS = v.frets.length;
    const rows = 5;
    const gx = 20, gy = 30, cw = nS > 4 ? 15 : 18, rh = 19;
    const W = gx * 2 + cw * (nS - 1);
    const H = gy + rh * rows + 24;
    const base = v.maxF <= 5 ? 1 : v.minF;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'cd', role: 'img', 'aria-label': o.aria || 'Sơ đồ thế bấm' });
    const sx = s => gx + s * cw;
    if (base === 1) el('rect', { x: gx - 1, y: gy - 4, width: cw * (nS - 1) + 2, height: 4.5, rx: 1, class: 'cd-nut' }, svg);
    else txt(svg, gx - 7, gy + rh * 0.5 + 4, String(base), { class: 'cd-base', 'text-anchor': 'end' });
    for (let r = 0; r <= rows; r++) el('line', { x1: gx, y1: gy + r * rh, x2: sx(nS - 1), y2: gy + r * rh, class: 'cd-line' }, svg);
    for (let s = 0; s < nS; s++) el('line', { x1: sx(s), y1: gy, x2: sx(s), y2: gy + rows * rh, class: 'cd-line' }, svg);
    v.frets.forEach((f, s) => {
      if (f < 0) txt(svg, sx(s), gy - 9, '×', { class: 'cd-x', 'text-anchor': 'middle' });
      else if (f === 0) el('circle', { cx: sx(s), cy: gy - 13, r: 3.6, class: 'cd-open' }, svg);
    });
    if (v.barre) {
      const r = v.barre.fret - base;
      const cy = gy + (r + 0.5) * rh;
      el('rect', { x: sx(v.barre.from) - 6.5, y: cy - 6.5, width: sx(v.barre.to) - sx(v.barre.from) + 13, height: 13, rx: 6.5, class: 'cd-barre' }, svg);
      txt(svg, (sx(v.barre.from) + sx(v.barre.to)) / 2, cy, '1', { class: 'cd-fing on-barre', 'text-anchor': 'middle', 'dominant-baseline': 'central' });
    }
    v.frets.forEach((f, s) => {
      if (f <= 0) return;
      if (v.barre && f === v.barre.fret && s >= v.barre.from && s <= v.barre.to) return;
      const cy = gy + (f - base + 0.5) * rh;
      const g = el('g', { class: 'cd-dot fam-' + ((o.fams && o.fams[s]) || 'none') }, svg);
      el('circle', { cx: sx(s), cy, r: 6.8 }, g);
      if (v.fingers && v.fingers[s]) txt(g, sx(s), cy, String(v.fingers[s]), { 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'cd-fing' });
    });
    if (o.bottom) {
      o.bottom.forEach((lab, s) => {
        if (!lab) return;
        txt(svg, sx(s), gy + rows * rh + 15, lab, { class: 'cd-iv fam-' + ((o.fams && o.fams[s]) || 'none'), 'text-anchor': 'middle' });
      });
    }
    return svg;
  }

  /* ------------------------------------------------------------------ */
  /* Bàn phím piano                                                      */
  /* ------------------------------------------------------------------ */
  const BLACK = new Set([1, 3, 6, 8, 10]);
  /** o = { start (một nốt C), octaves, marks: Map(midi → { label, fam, strong, ghost }), onClick(midi), cLabels, compact } */
  function piano(container, o) {
    const WW = o.compact ? 24 : 32, WH = o.compact ? 92 : 124;
    const BW = WW * 0.6, BH = WH * 0.62;
    const end = o.start + o.octaves * 12;
    const whites = [], blacks = [];
    let wi = 0;
    for (let m = o.start; m <= end; m++) {
      if (BLACK.has(m % 12)) blacks.push({ m, x: wi * WW - BW / 2 });
      else { whites.push({ m, x: wi * WW }); wi++; }
    }
    const W = wi * WW + 2, H = WH + 3;
    const svg = el('svg', { viewBox: `-1 -1 ${W} ${H}`, class: 'pk' + (o.compact ? ' compact' : ''), role: 'img', 'aria-label': o.aria || 'Bàn phím piano' });
    svg.style.minWidth = Math.round(W * 0.75) + 'px';
    const marks = o.marks || new Map();
    const dot = (g, cx, cy, mk, r) => {
      const d = el('g', { class: 'pk-mark fam-' + (mk.fam || 'none') + (mk.ghost ? ' ghost' : '') }, g);
      el('circle', { cx, cy, r }, d);
      if (mk.label) txt(d, cx, cy, mk.label, { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': labelSize(mk.label, r).toFixed(1) });
    };
    whites.forEach(k => {
      const mk = marks.get(k.m);
      const g = el('g', { 'data-m': k.m, class: 'pk-key' }, svg);
      el('rect', { x: k.x, y: 0, width: WW - 1, height: WH, rx: 3, class: 'pk-white' + (mk && !mk.ghost ? ' on fam-' + (mk.fam || 'none') : '') }, g);
      if (mk) dot(g, k.x + (WW - 1) / 2, WH - (o.compact ? 13 : 17), mk, o.compact ? 8.5 : 10.5);
      else if (o.cLabels !== false && k.m % 12 === 0) txt(g, k.x + (WW - 1) / 2, WH - 9, 'C' + (Math.floor(k.m / 12) - 1), { class: 'pk-c', 'text-anchor': 'middle' });
    });
    blacks.forEach(k => {
      const mk = marks.get(k.m);
      const g = el('g', { 'data-m': k.m, class: 'pk-key' }, svg);
      el('rect', { x: k.x, y: 0, width: BW, height: BH, rx: 2.5, class: 'pk-black' + (mk && !mk.ghost ? ' on fam-' + (mk.fam || 'none') : '') }, g);
      if (mk) dot(g, k.x + BW / 2, BH - (o.compact ? 11 : 13), mk, o.compact ? 7.5 : 9);
    });
    if (o.onClick) {
      svg.addEventListener('click', e => {
        const k = e.target.closest('[data-m]');
        if (k) o.onClick(+k.getAttribute('data-m'));
      });
    }
    return mount(container, svg);
  }

  /* ------------------------------------------------------------------ */
  /* Vòng quãng 5                                                        */
  /* ------------------------------------------------------------------ */
  function sector(cx, cy, r0, r1, a0, a1) {
    const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const [x0, y0] = p(r1, a0), [x1, y1] = p(r1, a1), [x2, y2] = p(r0, a1), [x3, y3] = p(r0, a0);
    return `M${x0.toFixed(2)},${y0.toFixed(2)} A${r1},${r1} 0 0 1 ${x1.toFixed(2)},${y1.toFixed(2)} L${x2.toFixed(2)},${y2.toFixed(2)} A${r0},${r0} 0 0 0 ${x3.toFixed(2)},${y3.toFixed(2)} Z`;
  }
  /** o = { majors[12], minors[12], sigs[12], sel: index, mode, onSelect(i, mode), center: [dòng1, dòng2] } */
  function circle(container, o) {
    const S = 420, c = S / 2;
    const svg = el('svg', { viewBox: `0 0 ${S} ${S}`, class: 'cof', role: 'img', 'aria-label': 'Vòng quãng 5' });
    const step = Math.PI / 6;
    const majorRN = o.mode === 'minor' ? ['VI', 'III', 'VII'] : ['IV', 'I', 'V'];
    const minorRN = o.mode === 'minor' ? ['iv', 'i', 'v'] : ['ii', 'vi', 'iii'];
    for (let i = 0; i < 12; i++) {
      const a = -Math.PI / 2 + i * step;
      const rel = ((i - o.sel + 18) % 12) - 6; // -1, 0, 1 là các hợp âm thuận
      const dia = Math.abs(rel) <= 1;
      const gMaj = el('g', { class: 'cof-seg maj' + (dia ? ' dia' : '') + (rel === 0 && o.mode === 'major' ? ' sel' : ''), 'data-i': i, 'data-mode': 'major', tabindex: 0, role: 'button', 'aria-label': o.majors[i] + ' trưởng' }, svg);
      el('path', { d: sector(c, c, 140, 204, a - step / 2 + 0.008, a + step / 2 - 0.008) }, gMaj);
      txt(gMaj, c + 176 * Math.cos(a), c + 176 * Math.sin(a) - 4, o.majors[i], { 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'cof-key' });
      txt(gMaj, c + 176 * Math.cos(a), c + 176 * Math.sin(a) + 14, dia ? majorRN[rel + 1] : o.sigs[i], { 'text-anchor': 'middle', 'dominant-baseline': 'central', class: dia ? 'cof-rn' : 'cof-sig' });
      const gMin = el('g', { class: 'cof-seg min' + (dia ? ' dia' : '') + (rel === 0 && o.mode === 'minor' ? ' sel' : ''), 'data-i': i, 'data-mode': 'minor', tabindex: 0, role: 'button', 'aria-label': o.minors[i] + ' thứ' }, svg);
      el('path', { d: sector(c, c, 92, 138, a - step / 2 + 0.01, a + step / 2 - 0.01) }, gMin);
      txt(gMin, c + 117 * Math.cos(a), c + 117 * Math.sin(a) - (dia ? 5 : 0), o.minors[i], { 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'cof-key small' });
      if (dia) txt(gMin, c + 117 * Math.cos(a), c + 117 * Math.sin(a) + 10, minorRN[rel + 1], { 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'cof-rn' });
    }
    el('circle', { cx: c, cy: c, r: 88, class: 'cof-center' }, svg);
    if (o.center) {
      txt(svg, c, c - 12, o.center[0], { 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'cof-c1' });
      txt(svg, c, c + 22, o.center[1], { 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'cof-c2' });
    }
    const pick = e => {
      const g = e.target.closest('[data-i]');
      if (g) o.onSelect(+g.getAttribute('data-i'), g.getAttribute('data-mode'));
    };
    svg.addEventListener('click', pick);
    svg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(e); } });
    return mount(container, svg);
  }

  /* ------------------------------------------------------------------ */
  /* Piano roll thu nhỏ (giống FL Studio)                                */
  /* ------------------------------------------------------------------ */
  /** o = { notes: [{ midi, start, dur, ci }], beats, blocks: [{ start, dur, label }], current, beatsPerBar } */
  function pianoRoll(container, o) {
    const notes = o.notes;
    if (!notes.length) { container.innerHTML = ''; return null; }
    const lo = Math.min(...notes.map(n => n.midi)) - 1;
    const hi = Math.max(...notes.map(n => n.midi)) + 1;
    const rowH = 6, head = 24;
    const avail = Math.max(320, (o.width || 640) - 2);
    const bw = Math.max(18, avail / o.beats);
    const W = o.beats * bw, H = head + (hi - lo + 1) * rowH;
    const svg = el('svg', { viewBox: `0 0 ${W.toFixed(1)} ${H}`, class: 'pr', role: 'img', 'aria-label': 'Piano roll của vòng hợp âm' });
    svg.style.width = W.toFixed(0) + 'px';
    svg.style.height = H + 'px';
    for (let m = lo; m <= hi; m++) {
      el('rect', { x: 0, y: head + (hi - m) * rowH, width: W, height: rowH, class: BLACK.has(m % 12) ? 'pr-row dark' : 'pr-row' }, svg);
    }
    for (let b = 0; b <= o.beats; b++) {
      el('line', { x1: b * bw, y1: head, x2: b * bw, y2: H, class: b % (o.beatsPerBar || 4) === 0 ? 'pr-bar' : 'pr-beat' }, svg);
    }
    o.blocks.forEach((b, i) => {
      const g = el('g', { class: 'pr-block' + (i === o.current ? ' cur' : ''), 'data-i': i }, svg);
      el('rect', { x: b.start * bw + 1, y: 2, width: b.dur * bw - 2, height: head - 5, rx: 4 }, g);
      txt(g, b.start * bw + 6, head / 2 - 0.5, b.label, { 'dominant-baseline': 'central', class: 'pr-label' });
    });
    notes.forEach(n => {
      el('rect', {
        x: n.start * bw + 1, y: head + (hi - n.midi) * rowH + 0.5, width: Math.max(2, n.dur * bw - 2), height: rowH - 1, rx: 1.5,
        class: 'pr-note c' + (n.ci % 2) + (n.ci === o.current ? ' cur' : '') + (n.bass ? ' bass' : '')
      }, svg);
    });
    if (o.onClick) {
      svg.addEventListener('click', e => {
        const g = e.target.closest('[data-i]');
        if (g) o.onClick(+g.getAttribute('data-i'));
      });
    }
    return mount(container, svg);
  }

  global.Draw = { fretboard, chordDiagram, piano, circle, pianoRoll, el, txt };
})(window);
