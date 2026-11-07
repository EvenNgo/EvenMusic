/* Phím & Phím — js/audio.js
 * Âm thanh bằng Web Audio API, không cần file mẫu:
 *  - Guitar: tổng hợp Karplus–Strong (dây gảy)
 *  - Piano: tổng hợp cộng (additive) với đường bao tắt dần
 *  - Metronome có bộ hẹn giờ nhìn trước (lookahead) để giữ nhịp chính xác
 *  - Tuner dùng micro, dò cao độ bằng hàm tự tương quan chuẩn hóa (NSDF)
 */
(function (global) {
  'use strict';

  const A = { ctx: null, volume: 0.8, instrument: 'guitar' };
  const groups = { free: new Set(), seq: new Set(), metro: new Set() };

  function ensure() {
    if (!A.ctx) {
      const AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      // iOS 17+: phát cả khi máy để chế độ im lặng
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* không hỗ trợ */ }
      const ctx = new AC();
      A.ctx = ctx;
      A.master = ctx.createGain();
      A.master.gain.value = A.volume;
      A.comp = ctx.createDynamicsCompressor();
      A.comp.threshold.value = -16;
      A.comp.knee.value = 12;
      A.comp.ratio.value = 4;
      A.comp.attack.value = 0.004;
      A.comp.release.value = 0.25;
      A.master.connect(A.comp);
      A.comp.connect(ctx.destination);

      // Bus guitar: cắt bớt tiếng rè ở dải cao, thêm chút “thân đàn” ở dải trầm-trung
      A.guitarBus = ctx.createBiquadFilter();
      A.guitarBus.type = 'lowpass';
      A.guitarBus.frequency.value = 5200;
      const body = ctx.createBiquadFilter();
      body.type = 'peaking';
      body.frequency.value = 180;
      body.gain.value = 3;
      body.Q.value = 0.9;
      A.guitarBus.connect(body);
      body.connect(A.master);

      A.pianoBus = ctx.createGain();
      A.pianoBus.connect(A.master);
      A.clickBus = ctx.createGain();
      A.clickBus.connect(A.master);
    }
    if (A.ctx.state === 'suspended') A.ctx.resume();
    return A.ctx;
  }

  function now() { return ensure() ? A.ctx.currentTime : 0; }

  function setVolume(v) {
    A.volume = v;
    if (A.master) A.master.gain.setTargetAtTime(v, A.ctx.currentTime, 0.02);
  }

  function track(node, group) {
    const set = groups[group || 'free'];
    set.add(node);
    node.onended = () => set.delete(node);
  }

  function stopGroup(group) {
    groups[group].forEach(n => { try { n.stop(); } catch (e) { /* đã dừng */ } });
    groups[group].clear();
  }

  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  /* ---------------- Guitar: Karplus–Strong ---------------- */
  const ksCache = new Map();
  function ksBuffer(m) {
    if (ksCache.has(m)) return ksCache.get(m);
    const ctx = A.ctx, sr = ctx.sampleRate;
    const f = hz(m);
    const N = Math.max(2, Math.floor(sr / f));
    const len = Math.floor(sr * 3.2);
    const buf = ctx.createBuffer(1, len, sr);
    const out = buf.getChannelData(0);
    const ring = new Float32Array(N);
    let prev = 0, mean = 0;
    for (let i = 0; i < N; i++) {
      prev = prev * 0.4 + (Math.random() * 2 - 1) * 0.6; // nhiễu đã lọc nhẹ → tiếng gảy ấm hơn
      ring[i] = prev;
      mean += prev;
    }
    mean /= N;
    for (let i = 0; i < N; i++) ring[i] -= mean;
    const halfLife = Math.max(0.35, Math.min(1.6, 1.6 - (m - 40) * 0.025));
    const decay = Math.pow(0.5, 1 / (f * halfLife));
    let idx = 0;
    for (let i = 0; i < len; i++) {
      const nxt = idx + 1 === N ? 0 : idx + 1;
      const cur = ring[idx];
      out[i] = cur;
      ring[idx] = decay * 0.5 * (cur + ring[nxt]);
      idx = nxt;
    }
    const fade = Math.floor(sr * 0.08);
    for (let i = 0; i < fade; i++) out[len - 1 - i] *= i / fade;
    // Chu kỳ thực của vòng trễ là N + 0.5 mẫu → chỉnh tốc độ phát để đúng cao độ.
    const entry = { buf, rate: f * (N + 0.5) / sr };
    ksCache.set(m, entry);
    return entry;
  }

  function playGuitar(m, when, dur, vel, group) {
    const ctx = A.ctx;
    const { buf, rate } = ksBuffer(m);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    const end = when + dur;
    g.gain.setValueAtTime(vel, when);
    g.gain.setValueAtTime(vel, end);
    g.gain.setTargetAtTime(0, end, 0.06);
    src.connect(g);
    g.connect(A.guitarBus);
    src.start(when);
    src.stop(end + 0.45);
    track(src, group);
  }

  /* ---------------- Piano: tổng hợp cộng ---------------- */
  const PARTIALS = [[1, 'triangle', 1], [2, 'sine', 0.32], [3, 'sine', 0.1], [4, 'sine', 0.04]];
  function playPiano(m, when, dur, vel, group) {
    const ctx = A.ctx;
    const f = hz(m);
    const rel = ctx.createGain();
    rel.gain.setValueAtTime(1, when);
    rel.gain.setValueAtTime(1, when + dur);
    rel.gain.setTargetAtTime(0, when + dur, 0.09);
    const env = ctx.createGain();
    const peak = vel * 0.34;
    const tail = Math.max(0.5, 3.0 - (m - 40) * 0.045);
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(peak, when + 0.006);
    env.gain.setTargetAtTime(peak * 0.38, when + 0.006, 0.1);
    env.gain.setTargetAtTime(0.0001, when + 0.16, tail / 2.4);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.5;
    lp.frequency.setValueAtTime(Math.min(15000, f * 9), when);
    lp.frequency.setTargetAtTime(Math.min(11000, f * 2.6), when, 0.32);
    PARTIALS.forEach(([mult, type, amp]) => {
      if (f * mult > 15000) return;
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f * mult;
      o.detune.value = (Math.random() - 0.5) * 5;
      const pg = ctx.createGain();
      pg.gain.value = amp;
      o.connect(pg);
      pg.connect(lp);
      o.start(when);
      o.stop(when + dur + 0.7);
      track(o, group);
    });
    lp.connect(env);
    env.connect(rel);
    rel.connect(A.pianoBus);
  }

  /* ---------------- API phát nốt ---------------- */
  function note(m, o) {
    if (!ensure()) return;
    o = o || {};
    const inst = o.instrument || A.instrument;
    const when = o.when !== undefined ? o.when : A.ctx.currentTime + 0.02;
    const dur = o.dur || (inst === 'guitar' ? 2.2 : 1.6);
    const vel = o.vel !== undefined ? o.vel : 0.8;
    (inst === 'guitar' ? playGuitar : playPiano)(m, when, dur, vel, o.group);
  }

  /** Phát hợp âm. style: 'strum' (quạt xuống), 'up' (quạt lên), 'block' (cùng lúc), 'arp' (rải). */
  function chord(midis, o) {
    if (!ensure() || !midis.length) return;
    o = o || {};
    const inst = o.instrument || A.instrument;
    const t0 = o.when !== undefined ? o.when : A.ctx.currentTime + 0.03;
    const style = o.style || (inst === 'guitar' ? 'strum' : 'block');
    let list = midis.slice().sort((a, b) => a - b);
    if (style === 'up') list.reverse();
    const gap = style === 'arp' ? (o.gap || 0.2) : style === 'block' ? 0 : (o.gap || 0.022);
    const vel = o.vel !== undefined ? o.vel : (inst === 'guitar' ? 0.62 : 0.55);
    list.forEach((m, i) => note(m, {
      instrument: inst, when: t0 + i * gap,
      dur: (o.dur || (style === 'arp' ? 2.4 : 2)) - (style === 'arp' ? 0 : i * gap),
      vel: vel * (style === 'up' ? 0.8 : 1), group: o.group
    }));
  }

  function sequence(midis, o) {
    if (!ensure()) return;
    o = o || {};
    const t0 = A.ctx.currentTime + 0.03;
    const step = o.step || 0.3;
    midis.forEach((m, i) => note(m, { instrument: o.instrument, when: t0 + i * step, dur: step * 1.6, vel: 0.75, group: o.group }));
    return midis.length * step;
  }

  /* ---------------- Metronome ---------------- */
  function click(when, level, group) {
    const ctx = A.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = level === 2 ? 1760 : level === 1 ? 1175 : 880;
    const amp = level === 2 ? 0.9 : level === 1 ? 0.55 : 0.26;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(amp, when + 0.0015);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
    o.connect(g);
    g.connect(A.clickBus);
    o.start(when);
    o.stop(when + 0.07);
    track(o, group || 'metro');
  }

  const PATTERNS = {
    '2/4': [2, 1], '3/4': [2, 1, 1], '4/4': [2, 1, 1, 1], '5/4': [2, 1, 1, 1, 1],
    '6/8': [2, 0, 0, 1, 0, 0], '7/8': [2, 0, 1, 0, 1, 0, 0], '12/8': [2, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0]
  };

  function Metronome() {
    this.bpm = 80;
    this.sig = '4/4';
    this.sub = 1;
    this.accent = true;
    this.running = false;
    this.onBeat = null;
    this.onTempo = null;
    this.trainer = null; // { step, bars, max }
  }
  Metronome.prototype.start = function () {
    const ctx = ensure();
    if (!ctx) return;
    this.stop();
    this.running = true;
    this.beat = 0;
    this.subIdx = 0;
    this.bar = 0;
    this.next = ctx.currentTime + 0.08;
    this.timer = setInterval(() => this._tick(), 25);
    this._tick();
  };
  Metronome.prototype._tick = function () {
    const ctx = A.ctx;
    const pattern = PATTERNS[this.sig] || PATTERNS['4/4'];
    const compound = this.sig.endsWith('/8');
    const sub = compound ? 1 : this.sub;
    while (this.next < ctx.currentTime + 0.12) {
      let level = 0;
      if (this.subIdx === 0) {
        level = pattern[this.beat];
        if (level === 2 && !this.accent) level = 1;
        const b = this.beat, bar = this.bar, cb = this.onBeat;
        if (cb) setTimeout(() => { if (this.running) cb(b, bar, pattern.length); }, Math.max(0, (this.next - ctx.currentTime) * 1000));
      }
      click(this.next, level);
      this.next += 60 / this.bpm / sub;
      this.subIdx++;
      if (this.subIdx >= sub) {
        this.subIdx = 0;
        this.beat++;
        if (this.beat >= pattern.length) {
          this.beat = 0;
          this.bar++;
          const tr = this.trainer;
          if (tr && this.bar % tr.bars === 0 && this.bpm < tr.max) {
            this.bpm = Math.min(tr.max, this.bpm + tr.step);
            if (this.onTempo) this.onTempo(this.bpm);
          }
        }
      }
    }
  };
  Metronome.prototype.stop = function () {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  };

  /* ---------------- Bộ phát tuần tự (vòng hợp âm) ---------------- */
  function Sequencer() { this.playing = false; this.timers = []; }
  /** schedule(t0) đặt lịch một lượt và trả về độ dài lượt (giây). opts.loop có thể là hàm. */
  Sequencer.prototype.play = function (schedule, opts) {
    const ctx = ensure();
    if (!ctx) return;
    this.stop();
    this.playing = true;
    const self = this;
    let t0 = ctx.currentTime + 0.12;
    (function pass() {
      if (!self.playing) return;
      const len = schedule(t0);
      const next = t0 + len;
      const loop = typeof opts.loop === 'function' ? opts.loop() : opts.loop;
      if (loop) {
        self.timers.push(setTimeout(() => { t0 = next; pass(); }, Math.max(0, (next - ctx.currentTime - 0.3) * 1000)));
      } else {
        self.timers.push(setTimeout(() => {
          const stillLoop = typeof opts.loop === 'function' ? opts.loop() : false;
          if (stillLoop && self.playing) { t0 = next; pass(); return; }
          self.playing = false;
          if (opts.onEnd) opts.onEnd();
        }, Math.max(0, (next - ctx.currentTime - 0.3) * 1000)));
      }
    })();
  };
  Sequencer.prototype.at = function (when, fn) {
    this.timers.push(setTimeout(fn, Math.max(0, (when - A.ctx.currentTime) * 1000)));
  };
  Sequencer.prototype.stop = function () {
    this.playing = false;
    this.timers.forEach(clearTimeout);
    this.timers = [];
    stopGroup('seq');
  };

  /* ---------------- Tuner ---------------- */
  function detectPitch(buf, sr) {
    const N = buf.length;
    let rms = 0;
    for (let i = 0; i < N; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / N);
    if (rms < 0.006) return null;
    const maxLag = Math.min(Math.floor(sr / 55), Math.floor(N / 2));
    const W = N - maxLag;
    const nsdf = new Float32Array(maxLag + 2);
    for (let lag = 1; lag <= maxLag; lag++) {
      let acf = 0, m = 0;
      for (let i = 0; i < W; i++) {
        const a = buf[i], b = buf[i + lag];
        acf += a * b;
        m += a * a + b * b;
      }
      nsdf[lag] = m > 0 ? 2 * acf / m : 0;
    }
    let i = 1;
    while (i < maxLag && nsdf[i] > 0) i++; // bỏ qua thùy dương ban đầu
    let globalMax = 0;
    for (let j = i; j < maxLag; j++) if (nsdf[j] > globalMax) globalMax = nsdf[j];
    if (globalMax < 0.6) return null;
    let lag0 = -1;
    for (; i < maxLag; i++) {
      if (nsdf[i] > nsdf[i - 1] && nsdf[i] >= nsdf[i + 1] && nsdf[i] >= 0.88 * globalMax) { lag0 = i; break; }
    }
    if (lag0 < 0) return null;
    const x1 = nsdf[lag0 - 1], x2 = nsdf[lag0], x3 = nsdf[lag0 + 1];
    const den = x1 - 2 * x2 + x3;
    const shift = den !== 0 ? 0.5 * (x1 - x3) / den : 0;
    return { freq: sr / (lag0 + shift), clarity: x2, rms };
  }

  function Tuner() { this.running = false; this.onPitch = null; this.a4 = 440; this.hist = []; }
  Tuner.prototype.start = async function () {
    const ctx = ensure();
    if (!ctx) throw new Error('no-audio');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no-mic');
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    });
    this.src = ctx.createMediaStreamSource(this.stream);
    this.an = ctx.createAnalyser();
    this.an.fftSize = 4096;
    this.src.connect(this.an);
    this.buf = new Float32Array(this.an.fftSize);
    this.running = true;
    this.hist = [];
    this.timer = setInterval(() => this._read(), 70);
  };
  Tuner.prototype._read = function () {
    this.an.getFloatTimeDomainData(this.buf);
    const r = detectPitch(this.buf, A.ctx.sampleRate);
    if (!r || r.freq < 55 || r.freq > 1400) {
      this.miss = (this.miss || 0) + 1;
      if (this.miss > 8) { this.hist = []; if (this.onPitch) this.onPitch(null); }
      return;
    }
    this.miss = 0;
    this.hist.push(r.freq);
    if (this.hist.length > 5) this.hist.shift();
    const sorted = this.hist.slice().sort((a, b) => a - b);
    const f = sorted[Math.floor(sorted.length / 2)];
    const midiF = 69 + 12 * Math.log2(f / this.a4);
    const midi = Math.round(midiF);
    if (this.onPitch) this.onPitch({ freq: f, midi, cents: (midiF - midi) * 100, level: r.rms });
  };
  Tuner.prototype.stop = function () {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    if (this.src) this.src.disconnect();
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    this.stream = null;
  };

  /** Phát âm chuẩn để lên dây theo tần số A4 tùy chọn (vd. 440 Hz). */
  function reference(m, a4) {
    if (!ensure()) return;
    const ctx = A.ctx;
    const f = (a4 || 440) * Math.pow(2, (m - 69) / 12);
    const o = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o2.type = 'sine';
    o.frequency.value = f;
    o2.frequency.value = f * 2;
    const g2 = ctx.createGain();
    g2.gain.value = 0.25;
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.35, t + 0.02);
    g.gain.setTargetAtTime(0, t + 1.6, 0.25);
    o.connect(g);
    o2.connect(g2);
    g2.connect(g);
    g.connect(A.master);
    o.start(t); o2.start(t);
    o.stop(t + 3); o2.stop(t + 3);
    track(o); track(o2);
  }

  Object.assign(A, {
    ensure, now, setVolume, note, chord, sequence, click, stopGroup, reference,
    Metronome, Sequencer, Tuner, detectPitch, PATTERNS
  });
  global.Sound = A;
})(typeof window !== 'undefined' ? window : globalThis);
