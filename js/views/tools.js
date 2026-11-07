/* Phím & Phím — Trang “Metronome & Tuner”. */
(function () {
  'use strict';
  const { h, $, $$, T, S } = App;

  const TEMPO_NAMES = [[40, 'Largo'], [60, 'Larghetto'], [66, 'Adagio'], [76, 'Andante'], [108, 'Moderato'], [120, 'Allegro'], [156, 'Vivace'], [176, 'Presto'], [200, 'Prestissimo']];
  const tempoName = bpm => { let n = TEMPO_NAMES[0][1]; TEMPO_NAMES.forEach(([b, name]) => { if (bpm >= b) n = name; }); return n; };

  const metro = App.metro = new Sound.Metronome();

  function syncMetro() {
    const m = S.metro;
    metro.bpm = m.bpm; metro.sig = m.sig; metro.sub = m.sub; metro.accent = m.accent;
    metro.trainer = m.trainer ? { step: m.step, bars: m.bars, max: m.max } : null;
  }

  /** Chip nhỏ trên thanh đầu trang khi metronome đang chạy ở trang khác. */
  function updateChip() {
    const chip = $('#metro-chip');
    chip.hidden = !metro.running;
    chip.querySelector('span:last-child').textContent = S.metro.bpm + ' BPM';
  }

  const V = App.views.tools = {
    mount() {
      const m = S.metro;
      const bpmOut = $('#m-bpm'), range = $('#m-range');
      const setBpm = v => {
        m.bpm = Math.max(30, Math.min(240, Math.round(v)));
        metro.bpm = m.bpm;
        bpmOut.textContent = m.bpm;
        range.value = m.bpm;
        $('#m-tempo').textContent = '≈ ' + tempoName(m.bpm);
        updateChip();
        App.save();
      };
      this.setBpm = setBpm;
      range.addEventListener('input', () => setBpm(+range.value));
      $('#m-minus').addEventListener('click', () => setBpm(m.bpm - 1));
      $('#m-plus').addEventListener('click', () => setBpm(m.bpm + 1));
      $('#m-minus5').addEventListener('click', () => setBpm(m.bpm - 5));
      $('#m-plus5').addEventListener('click', () => setBpm(m.bpm + 5));

      const taps = [];
      $('#m-tap').addEventListener('click', () => {
        const now = performance.now();
        if (taps.length && now - taps[taps.length - 1] > 2000) taps.length = 0;
        taps.push(now);
        if (taps.length > 6) taps.shift();
        if (taps.length >= 2) {
          const gaps = taps.slice(1).map((t, i) => t - taps[i]);
          setBpm(60000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length));
        }
      });

      const sig = $('#m-sig');
      Object.keys(Sound.PATTERNS).forEach(k => sig.appendChild(h('option', { value: k, selected: k === m.sig }, k)));
      sig.addEventListener('change', () => { m.sig = sig.value; syncMetro(); this.renderBeats(); this.renderSub(); App.save(); });
      this.renderSub();
      const acc = $('#m-accent');
      acc.checked = m.accent;
      acc.addEventListener('change', () => { m.accent = acc.checked; syncMetro(); App.save(); });

      const tr = $('#m-trainer'), step = $('#m-step'), bars = $('#m-bars'), max = $('#m-max');
      tr.checked = m.trainer; step.value = m.step; bars.value = m.bars; max.value = m.max;
      const upTrainer = () => {
        m.trainer = tr.checked;
        m.step = Math.max(1, Math.min(20, +step.value || 5));
        m.bars = Math.max(1, Math.min(16, +bars.value || 4));
        m.max = Math.max(40, Math.min(240, +max.value || 140));
        syncMetro(); App.save();
      };
      [tr, step, bars, max].forEach(e => e.addEventListener('change', upTrainer));

      $('#m-start').addEventListener('click', () => this.toggleMetro());
      $('#metro-chip').addEventListener('click', () => this.toggleMetro());
      metro.onBeat = (b, bar, n) => {
        $$('#m-beats i').forEach((d, k) => d.classList.toggle('on', k === b));
      };
      metro.onTempo = bpm => setBpm(bpm);

      // Tuner
      this.tuner = new Sound.Tuner();
      const a4 = $('#u-a4');
      [432, 436, 438, 440, 442, 444].forEach(v => a4.appendChild(h('option', { value: v, selected: v === S.tuner.a4 }, v + ' Hz')));
      a4.addEventListener('change', () => { S.tuner.a4 = +a4.value; this.tuner.a4 = S.tuner.a4; this.renderStrings(); App.save(); });
      this.tuner.a4 = S.tuner.a4;
      $('#u-start').addEventListener('click', () => this.toggleTuner());
      this.tuner.onPitch = p => this.showPitch(p);
      this.drawGauge();
    },

    toggleMetro() {
      if (metro.running) metro.stop();
      else { syncMetro(); metro.start(); }
      this.updateMetroBtn();
      updateChip();
      if (!metro.running) $$('#m-beats i').forEach(d => d.classList.remove('on'));
    },
    updateMetroBtn() {
      const b = $('#m-start');
      b.innerHTML = '';
      b.appendChild(App.icon(metro.running ? 'stop' : 'play'));
      b.appendChild(h('span', null, metro.running ? 'Dừng' : 'Bắt đầu'));
      b.setAttribute('aria-pressed', metro.running ? 'true' : 'false');
    },
    renderBeats() {
      const n = (Sound.PATTERNS[S.metro.sig] || Sound.PATTERNS['4/4']);
      const box = $('#m-beats');
      box.innerHTML = '';
      n.forEach(level => box.appendChild(h('i', { class: 'lv' + level })));
    },
    renderSub() {
      const compound = S.metro.sig.endsWith('/8');
      const el = $('#m-sub');
      App.seg(el, [['1', 'Nốt đen'], ['2', 'Móc đơn'], ['3', 'Chùm ba'], ['4', 'Móc kép']], () => String(compound ? 1 : S.metro.sub), v => {
        if (compound) return;
        S.metro.sub = +v; syncMetro(); App.save();
      }, 'Chia nhỏ phách');
      el.classList.toggle('disabled', compound);
      $('#m-sub-note').textContent = compound ? 'Nhịp x/8 tính BPM theo nốt móc đơn.' : '';
    },

    async toggleTuner() {
      const btn = $('#u-start');
      if (this.tuner.running) {
        this.tuner.stop();
        this.showPitch(null);
        btn.lastChild.textContent = 'Bật micro';
        $('#u-status').textContent = 'Đã tắt micro.';
        return;
      }
      try {
        $('#u-status').textContent = 'Đang xin quyền dùng micro…';
        await this.tuner.start();
        btn.lastChild.textContent = 'Tắt micro';
        $('#u-status').textContent = 'Đang nghe. Gảy từng dây và giữ cho nốt ngân.';
      } catch (e) {
        const insecure = !window.isSecureContext;
        $('#u-status').textContent = insecure
          ? 'Micro chỉ hoạt động trên trang https (ví dụ GitHub Pages) hoặc http://localhost. Hãy mở trang qua một trong hai cách đó.'
          : 'Không bật được micro. Hãy cho phép trang dùng micro trong cài đặt của trình duyệt rồi thử lại.';
      }
    },

    drawGauge() {
      const svg = Draw.el('svg', { viewBox: '0 0 240 132', class: 'gauge', role: 'img', 'aria-label': 'Kim chỉ độ lệch cao độ' });
      const cx = 120, cy = 120, r = 100;
      for (let c = -50; c <= 50; c += 5) {
        const a = (c / 50) * (Math.PI / 2.6) - Math.PI / 2;
        const big = c % 25 === 0;
        const r0 = big ? r - 16 : r - 9;
        Draw.el('line', {
          x1: cx + r0 * Math.cos(a), y1: cy + r0 * Math.sin(a), x2: cx + r * Math.cos(a), y2: cy + r * Math.sin(a),
          class: 'g-tick' + (c === 0 ? ' zero' : '')
        }, svg);
      }
      Draw.txt(svg, cx - 82, cy - 2, '♭', { class: 'g-lab', 'text-anchor': 'middle' });
      Draw.txt(svg, cx + 82, cy - 2, '♯', { class: 'g-lab', 'text-anchor': 'middle' });
      this.needle = Draw.el('line', { x1: cx, y1: cy, x2: cx, y2: cy - r + 6, class: 'g-needle' }, svg);
      Draw.el('circle', { cx, cy, r: 6, class: 'g-hub' }, svg);
      const box = $('#u-gauge');
      box.innerHTML = '';
      box.appendChild(svg);
    },

    showPitch(p) {
      const note = $('#u-note'), oct = $('#u-oct'), info = $('#u-info'), wrap = $('#u-wrap');
      if (!p) {
        note.textContent = '–'; oct.textContent = ''; info.textContent = this.tuner.running ? 'Chưa nghe rõ nốt nào.' : '';
        this.needle.setAttribute('transform', 'rotate(0 120 120)');
        wrap.classList.remove('in-tune', 'close');
        $$('#u-strings .chip').forEach(c => c.classList.remove('on'));
        return;
      }
      const n = T.fromPc(p.midi, 'common');
      note.textContent = App.nn(n);
      oct.textContent = T.octaveOf(p.midi);
      const cents = Math.max(-50, Math.min(50, p.cents));
      this.needle.setAttribute('transform', 'rotate(' + (cents / 50 * (180 / 2.6)).toFixed(1) + ' 120 120)');
      const abs = Math.abs(p.cents);
      wrap.classList.toggle('in-tune', abs <= 5);
      wrap.classList.toggle('close', abs > 5 && abs <= 15);
      const t = App.tuning();
      let best = 0, bd = Infinity;
      const midiF = p.midi + p.cents / 100;
      t.midis.forEach((m, s) => { const d = Math.abs(m - midiF); if (d < bd) { bd = d; best = s; } });
      const dir = abs <= 5 ? 'đã chuẩn' : p.cents < 0 ? 'thấp, vặn căng lên' : 'cao, nới dây ra';
      info.textContent = p.freq.toFixed(1) + ' Hz, lệch ' + (p.cents > 0 ? '+' : '') + Math.round(p.cents) + ' cent (' + dir + ')' + (bd < 2.5 ? '. Gần dây ' + (t.midis.length - best) : '');
      $$('#u-strings .chip').forEach((c, k) => c.classList.toggle('on', bd < 2.5 && k === best));
    },

    renderStrings() {
      const t = App.tuning();
      const box = $('#u-strings');
      box.innerHTML = '';
      t.midis.forEach((m, s) => box.appendChild(h('button', {
        type: 'button', class: 'chip', onclick: () => Sound.reference(m, S.tuner.a4)
      }, h('strong', null, 'Dây ' + (t.midis.length - s)), ' ' + t.pitches[s])));
    },

    leave() {
      if (this.tuner && this.tuner.running) { this.tuner.stop(); this.showPitch(null); $('#u-start').lastChild.textContent = 'Bật micro'; }
      updateChip();
    },

    render() {
      this.dirty = false;
      this.setBpm(S.metro.bpm);
      this.renderBeats();
      this.updateMetroBtn();
      this.renderStrings();
      $('#u-tuning').textContent = App.tuning().name;
    }
  };
})();
