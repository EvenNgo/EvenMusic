/* Phím & Phím — Trang “Bài học & lộ trình”. */
(function () {
  'use strict';
  const { h, $, T, S } = App;

  const V = App.views.learn = {
    mount() {
      const root = $('#view-learn');
      root.addEventListener('click', e => {
        const b = e.target.closest('[data-seq],[data-play],[data-chord],[data-prog],[data-go]');
        if (!b) return;
        if (b.dataset.prog) this.playProg(b.dataset.prog);
        else if (b.dataset.seq) Sound.sequence(b.dataset.seq.split(',').map(Number), { instrument: 'piano', step: 0.32 });
        else if (b.dataset.play) Sound.chord(b.dataset.play.split(',').map(Number), { instrument: 'piano', style: 'block' });
        else if (b.dataset.chord) {
          const [r, type] = b.dataset.chord.split(':');
          App.playChord(T.parseNote(r), type);
        } else this.go(b.dataset.go.split('|'));
      });
    },

    /** Phát lần lượt các hợp âm, mỗi hợp âm khoảng 1,4 giây. */
    playProg(text) {
      Sound.stopGroup('free');
      const t0 = Sound.now() + 0.05;
      const inst = S.settings.instrument;
      text.split(',').forEach((x, i) => {
        const [r, type] = x.split(':');
        Sound.chord(App.chordMidis(T.parseNote(r), type), { instrument: inst, when: t0 + i * 1.6, dur: 1.7 });
      });
    },

    go([view, a, b]) {
      if (view === 'chord') App.go('chord', st => { st.chord.root = a; st.chord.type = b; st.chord.voicing = 0; st.chord.bass = ''; st.chord.inv = 0; });
      else if (view === 'scale') App.go('scale', st => { st.scale.root = a; st.scale.type = b; st.scale.pos = 0; st.scale.focus = null; });
      else if (view === 'fret') App.go('fret', st => { st.fret.mode = a || 'all'; });
      else if (view === 'train') App.go('train', st => { st.train.mode = a || 'interval'; if (App.views.train) App.views.train.q = null; });
      else App.go(view);
    },

    render() {
      this.dirty = false;
      const road = $('#l-road');
      road.innerHTML = '';
      window.ROADMAP.forEach(track => {
        const done = track.items.filter(([id]) => S.road[id]).length;
        const meter = h('div', { class: 'meter', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': track.items.length, 'aria-valuenow': done, 'aria-label': 'Tiến độ ' + track.title },
          h('span', { style: 'width:' + (done / track.items.length * 100).toFixed(1) + '%' }));
        const list = h('ul', { class: 'checklist' });
        track.items.forEach(([id, text]) => {
          const cb = h('input', {
            type: 'checkbox', id: 'road-' + id, checked: !!S.road[id],
            onchange: e => { S.road[id] = e.target.checked; App.save(); this.render(); }
          });
          list.appendChild(h('li', null, cb, h('label', { for: 'road-' + id }, text)));
        });
        road.appendChild(h('section', { class: 'track' },
          h('div', { class: 'track-head' }, h('h3', null, track.title), h('span', { class: 'track-count' }, done + '/' + track.items.length)),
          meter, list));
      });

      const box = $('#l-lessons');
      if (box.childElementCount) return; // nội dung bài học không đổi, giữ nguyên trạng thái mở/đóng
      window.LESSONS.forEach((l, i) => {
        box.appendChild(h('details', { class: 'lesson', id: 'bai-' + l.id, open: i === 0 },
          h('summary', null, h('span', { class: 'lesson-n' }, String(i + 1)), h('span', { class: 'lesson-t' }, l.title)),
          h('div', { class: 'lesson-body', html: l.html })));
      });
    }
  };
})();
