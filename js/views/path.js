/* Phím & Phím — Trang “Hôm nay”: lộ trình có hướng dẫn từng bước, chọn sẵn việc cần làm,
 * bản 5 phút cho hôm mệt, mục tiêu theo tuần, hẹn giờ, ghi chú và nhật ký. */
(function () {
  'use strict';
  const { h, $, S } = App;

  const DAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const pad = n => String(n).padStart(2, '0');
  const dayKey = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const today = () => dayKey(new Date());
  const fmtDay = k => { const [y, m, d] = k.split('-'); return d + '/' + m + '/' + y; };
  /** Các ngày (khóa YYYY-MM-DD) của tuần hiện tại, bắt đầu từ thứ Hai. */
  function weekDays() {
    const d = new Date();
    const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    return [...Array(7)].map((_, i) => dayKey(new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i)));
  }

  const allSteps = () => window.PATH.flatMap(st => st.steps.map(s => Object.assign({ stage: st }, s)));
  const findStep = id => allSteps().find(s => s.id === id);

  const V = App.views.path = {
    timer: null,
    mount() {
      const root = $('#view-path');
      root.addEventListener('click', e => {
        const b = e.target.closest('[data-go]');
        if (b) { e.preventDefault(); this.go(b.dataset.go); }
      });
    },
    leave() { this.stopTimer(); },

    st() {
      const p = S.path;
      ['done', 'light', 'skip', 'notes', 'checks'].forEach(k => { if (!p[k] || typeof p[k] !== 'object') p[k] = {}; });
      if (!Array.isArray(p.log)) p.log = [];
      if (![2, 3, 4, 5, 7].includes(p.weekGoal)) p.weekGoal = 3;
      return p;
    },

    /** Bước đang làm: bước người dùng chọn, nếu không thì bước đầu tiên chưa xong và chưa bỏ qua. */
    current() {
      const p = this.st();
      const steps = allSteps();
      if (p.focus) {
        const f = steps.find(s => s.id === p.focus);
        if (f && !p.done[f.id]) return f;
      }
      return steps.find(s => !p.done[s.id] && !p.skip[s.id]) || steps.find(s => !p.done[s.id]) || null;
    },

    log(kind, step, min) {
      const p = this.st();
      p.log.push({ d: today(), id: step ? step.id : null, k: kind, m: min || 0 });
      if (p.log.length > 400) p.log = p.log.slice(-400);
    },

    go(target) {
      const [a, b, c] = target.split('|');
      if (a === 'drill') {
        App.go('train', st => {
          st.train.mode = 'build';
          st.train.buildSet = b.split(',');
          st.train.buildRoots = c === 'all' ? 'all' : 'natural';
          if (App.views.train) App.views.train.q = null;
        });
      } else if (a === 'lesson') {
        App.go('learn');
        setTimeout(() => {
          const el = document.getElementById('bai-' + b);
          if (el) { el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        }, 80);
      } else App.views.learn.go([a, b, c]);
    },

    /* ---------- hẹn giờ ---------- */
    startTimer(min) {
      this.stopTimer();
      this.endAt = Date.now() + min * 60000;
      this.timerMin = min;
      const tick = () => {
        const el = $('#p-timer');
        const left = Math.max(0, this.endAt - Date.now());
        if (el) el.textContent = Math.floor(left / 60000) + ':' + pad(Math.floor(left / 1000) % 60);
        if (left <= 0) {
          this.stopTimer();
          Sound.chord([60, 64, 67, 72], { instrument: 'piano', style: 'arp', gap: 0.18 });
          if (el) el.textContent = 'Hết giờ, giỏi lắm! Dừng ở đây cũng được.';
        }
      };
      tick();
      this.timer = setInterval(tick, 500);
      this.renderTimerBtn();
    },
    stopTimer() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      this.renderTimerBtn();
    },
    renderTimerBtn() {
      const b = $('#p-timer-btn');
      if (b) b.textContent = this.timer ? 'Dừng hẹn giờ' : 'Bắt đầu hẹn giờ';
    },

    /* ---------- vẽ ---------- */
    render() {
      this.dirty = false;
      this.st();
      this.renderWeek();
      this.renderToday();
      this.renderTips();
      this.renderPath();
      this.renderLog();
      this.renderResources();
    },

    renderWeek() {
      const p = this.st();
      const box = $('#p-week');
      box.innerHTML = '';
      const days = weekDays();
      const active = new Set(p.log.map(l => l.d));
      const count = days.filter(d => active.has(d)).length;
      const t = today();
      const dots = h('div', { class: 'week-dots', role: 'list', 'aria-label': 'Các buổi tập trong tuần' },
        days.map((d, i) => h('span', {
          role: 'listitem', class: 'wday' + (active.has(d) ? ' on' : '') + (d === t ? ' today' : ''),
          title: fmtDay(d) + (active.has(d) ? ': có tập' : '')
        }, DAY_NAMES[i])));
      const goalSel = h('select', { 'aria-label': 'Mục tiêu số buổi mỗi tuần', onchange: e => { p.weekGoal = +e.target.value; App.save(); this.renderWeek(); } },
        [2, 3, 4, 5, 7].map(n => h('option', { value: n, selected: n === p.weekGoal }, n + ' buổi')));
      const msg = count >= p.weekGoal ? 'Đã đạt mục tiêu tuần này. Tập thêm là phần thưởng, nghỉ cũng không sao.'
        : count === 0 ? 'Tuần mới: chỉ cần bắt đầu bằng một buổi ngắn.'
          : 'Còn ' + (p.weekGoal - count) + ' buổi nữa là đạt mục tiêu tuần.';
      const total = allSteps().length;
      const done = allSteps().filter(s => p.done[s.id]).length;
      box.appendChild(h('div', { class: 'week-card' },
        h('div', { class: 'week-top' },
          h('div', null, h('span', { class: 'week-n' }, count + '/' + p.weekGoal), h('span', { class: 'week-k' }, 'buổi tuần này')),
          h('label', { class: 'mini' }, 'Mục tiêu ', goalSel)),
        dots,
        h('p', { class: 'hint' }, msg + ' Tổng tiến độ: ' + done + '/' + total + ' bước.')));
    },

    renderToday() {
      const p = this.st();
      const box = $('#p-today');
      box.innerHTML = '';
      const s = this.current();
      if (!s) {
        box.appendChild(h('div', { class: 'today-card' }, h('h2', null, 'Bạn đã đi hết lộ trình!'),
          h('p', null, 'Hãy tiếp tục làm bài của riêng mình, hoặc chọn lại một bước bất kỳ bên dưới để ôn.')));
        return;
      }
      const checks = p.checks[s.id] || (p.checks[s.id] = s.done.map(() => false));
      const allOk = checks.every(Boolean);
      const light = this.showLight;

      const crit = h('ul', { class: 'crit' }, s.done.map((text, i) => {
        const id = 'crit-' + s.id + '-' + i;
        return h('li', null,
          h('input', { type: 'checkbox', id, checked: !!checks[i], onchange: e => { checks[i] = e.target.checked; App.save(); this.updateDoneBtn(checks); } }),
          h('label', { for: id }, text));
      }));

      const note = h('textarea', { class: 'note', rows: 3, placeholder: 'Ghi chú: hôm nay kẹt ở đâu, lần sau cần làm gì…', 'aria-label': 'Ghi chú cho bước này' });
      note.value = p.notes[s.id] || '';
      note.addEventListener('input', () => { p.notes[s.id] = note.value; App.save(); });

      const links = [];
      (s.go || []).forEach(([target, label]) => links.push(h('button', { type: 'button', class: 'lgo', 'data-go': target }, label)));
      (s.yt || []).forEach(([q, label]) => links.push(h('a', { class: 'lgo yt', href: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q), target: '_blank', rel: 'noopener' }, '▶ ' + label)));

      const card = h('article', { class: 'today-card', 'aria-labelledby': 'p-step-title' },
        h('p', { class: 'today-stage' }, s.stage.title),
        h('h2', { id: 'p-step-title' }, s.t),
        h('p', { class: 'today-meta' }, '⏱ khoảng ' + s.min + ' phút' + (p.focus === s.id ? ' · bạn đã chọn bước này' : '')),
        h('p', { class: 'today-why' }, s.why),
        light
          ? h('div', { class: 'light-box' },
            h('h3', null, 'Bản 5 phút cho hôm mệt'),
            h('p', null, s.light),
            h('div', { class: 'row gap wrap' },
              App.btn('Đã làm bản 5 phút', null, () => {
                p.light[s.id] = today(); this.log('light', s, 5); App.save();
                this.showLight = false; this.flash('Vậy là hôm nay vẫn có tập. Nghỉ ngơi đi nhé!'); this.render();
              }),
              App.btn('Quay lại bản đầy đủ', null, () => { this.showLight = false; this.renderToday(); }, 'ghost')))
          : h('div', null,
            h('h3', null, 'Làm thế nào'),
            h('ol', { class: 'how' }, s.how.map(x => h('li', null, x))),
            links.length ? h('div', { class: 'today-links' }, links) : null,
            h('h3', null, 'Xong khi (tự tick)'),
            crit),
        h('div', { class: 'timer-row' },
          h('button', { type: 'button', class: 'btn ghost sm', id: 'p-timer-btn', onclick: () => this.timer ? this.stopTimer() : this.startTimer(light ? 5 : s.min) }, 'Bắt đầu hẹn giờ'),
          h('span', { id: 'p-timer', class: 'timer-txt', 'aria-live': 'polite' }, '')),
        note,
        light ? null : h('div', { class: 'row gap wrap today-actions' },
          App.btn(allOk ? 'Hoàn thành bước này ✓' : 'Hoàn thành bước này', null, () => {
            if (!checks.every(Boolean) && !confirm('Chưa tick hết tiêu chí “Xong khi”. Vẫn đánh dấu hoàn thành?')) return;
            p.done[s.id] = today(); delete p.skip[s.id];
            if (p.focus === s.id) p.focus = null;
            this.log('done', s, s.min); App.save();
            this.stopTimer();
            this.flash('Xong bước “' + s.t + '”. Bước tiếp theo đã được chọn sẵn cho lần sau.');
            this.render();
          }, allOk ? '' : 'ghost', { id: 'p-done-btn' }),
          App.btn('Hôm nay mệt: làm bản 5 phút', null, () => { this.showLight = true; this.renderToday(); }, 'ghost'),
          App.btn('Ghi nhận buổi tập (chưa xong bước)', null, () => {
            this.log('session', s, s.min); App.save();
            this.flash('Đã ghi nhận buổi tập hôm nay. Lần sau làm tiếp bước này.'); this.render();
          }, 'ghost'),
          App.btn('Bỏ qua bước này', null, () => {
            p.skip[s.id] = today(); if (p.focus === s.id) p.focus = null; App.save(); this.render();
          }, 'ghost sm')),
        h('p', { id: 'p-flash', class: 'flash', 'aria-live': 'polite' }, this.flashMsg || ''));
      this.flashMsg = '';
      box.appendChild(card);
      if (this.timer) this.renderTimerBtn();
    },
    flash(msg) { this.flashMsg = msg; },
    updateDoneBtn(checks) {
      const b = $('#p-done-btn');
      if (!b) return;
      const ok = checks.every(Boolean);
      b.classList.toggle('ghost', !ok);
      b.querySelector('span').textContent = ok ? 'Hoàn thành bước này ✓' : 'Hoàn thành bước này';
    },

    renderTips() {
      const box = $('#p-tips');
      if (box.childElementCount) return;
      box.appendChild(h('details', { class: 'lesson' },
        h('summary', null, h('span', { class: 'lesson-n' }, '?'), h('span', { class: 'lesson-t' }, 'Đang mệt hoặc thấy mông lung? Đọc cái này trước')),
        h('div', { class: 'lesson-body' }, h('ul', null, window.PATH_TIPS.map(([a, b]) => h('li', null, h('strong', null, a + ': '), b))))));
    },

    renderPath() {
      const p = this.st();
      const box = $('#p-path');
      box.innerHTML = '';
      const cur = this.current();
      window.PATH.forEach(stage => {
        const done = stage.steps.filter(s => p.done[s.id]).length;
        const list = h('ol', { class: 'steps' });
        stage.steps.forEach(s => {
          const st = p.done[s.id] ? 'done' : cur && cur.id === s.id ? 'cur' : p.skip[s.id] ? 'skip' : 'todo';
          const icon = { done: '✓', cur: '▶', skip: '↷', todo: '○' }[st];
          const label = { done: 'Đã xong ' + fmtDay(p.done[s.id] || today()), cur: 'Đang làm', skip: 'Đã bỏ qua', todo: '' }[st];
          list.appendChild(h('li', { class: 'step ' + st },
            h('span', { class: 'step-ic', 'aria-hidden': 'true' }, icon),
            h('div', { class: 'step-main' },
              h('span', { class: 'step-t' }, s.t),
              h('span', { class: 'step-sub' }, s.min + ' phút' + (label ? ' · ' + label : '') + (p.notes[s.id] ? ' · có ghi chú' : ''))),
            st === 'cur' ? null : h('button', {
              type: 'button', class: 'btn ghost sm',
              onclick: () => {
                if (p.done[s.id] && !confirm('Bước này đã xong. Làm lại (bỏ dấu hoàn thành)?')) return;
                delete p.done[s.id]; delete p.skip[s.id]; p.focus = s.id; this.showLight = false; App.save();
                this.render();
                $('#p-today').scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, p.done[s.id] ? 'Làm lại' : 'Làm bước này')));
        });
        box.appendChild(h('section', { class: 'stage' },
          h('div', { class: 'track-head' }, h('h3', null, stage.title), h('span', { class: 'track-count' }, done + '/' + stage.steps.length)),
          h('p', { class: 'hint' }, stage.goal + ' (' + stage.weeks + ')'),
          h('div', { class: 'meter', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': stage.steps.length, 'aria-valuenow': done, 'aria-label': 'Tiến độ ' + stage.title },
            h('span', { style: 'width:' + (done / stage.steps.length * 100).toFixed(1) + '%' })),
          list));
      });
    },

    renderLog() {
      const p = this.st();
      const box = $('#p-log');
      box.innerHTML = '';
      const items = p.log.slice(-12).reverse();
      if (!items.length) { box.appendChild(h('p', { class: 'hint' }, 'Chưa có buổi tập nào. Buổi đầu tiên chỉ cần 5 phút.')); return; }
      const kind = { done: 'Hoàn thành', light: 'Bản 5 phút', session: 'Có tập' };
      box.appendChild(h('ul', { class: 'log' }, items.map(l => {
        const s = l.id && findStep(l.id);
        return h('li', null, h('span', { class: 'log-d' }, fmtDay(l.d)), h('span', { class: 'log-k ' + l.k }, kind[l.k] || l.k), h('span', null, s ? s.t : ''));
      })));
    },

    renderResources() {
      const box = $('#p-res');
      if (box.childElementCount) return;
      window.RESOURCES.forEach(g => {
        box.appendChild(h('section', { class: 'res-group' },
          h('h3', null, g.title),
          h('ul', { class: 'res' }, g.items.map(([name, desc, url]) => h('li', null,
            h('a', { href: url, target: '_blank', rel: 'noopener' }, name),
            h('span', null, desc))))));
      });
    }
  };
})();
