/* WordGraph UI: shared helpers, screen registry, home screen and navigation. */
(function (WG) {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (n) => Number(n).toLocaleString('en-IN');
  const TILE = ['x', 'y', 'g'];

  WG.ui = {
    esc, fmt,
    /** One letter tile. state: 0 grey, 1 yellow, 2 green, 'plain', 'hl'. */
    tile(letter, state, cls) {
      const c = typeof state === 'number' ? TILE[state] : state;
      return `<span class="tile ${c} ${cls || ''}">${esc(letter)}</span>`;
    },
    word(w, cls, hlIndex) {
      return `<div class="trow">${[...w].map((ch, i) => WG.ui.tile(ch, i === hlIndex ? 'hl' : 'plain', cls)).join('')}</div>`;
    },
    pills(list) {
      return `<div class="concept">${list.map(([t, u]) => `<span class="pill u${u === 'III' ? 3 : 4}">${esc(t)} · Unit ${u}</span>`).join('')}</div>`;
    },
    /** Bar strip of branch sizes (largest first); the chosen branch is highlighted. */
    bars(sizes, chosen) {
      const shown = sizes.slice(0, 80), n = shown.length, W = 700, H = 46;
      const max = Math.max(...shown, 2), bw = W / Math.max(n, 20);
      let hit = false, s = '';
      shown.forEach((v, i) => {
        const h = 4 + (H - 6) * Math.log(v + 1) / Math.log(max + 1);
        const on = !hit && v === chosen; if (on) hit = true;
        s += `<rect x="${(i * bw).toFixed(1)}" y="${(H - h).toFixed(1)}" width="${Math.max(bw - 1.5, 1).toFixed(1)}" height="${h.toFixed(1)}" rx="1" style="fill:${on ? 'var(--blue)' : 'var(--x)'};opacity:${on ? 1 : .55}"/>`;
      });
      return `<svg class="bars" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Branch sizes"><title>${n} branches, largest ${sizes[0]}</title>${s}</svg>`;
    },
    clean(v) { return String(v || '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 5); },
    /**
     * A slide-up "How it works" sheet. Screens include this in their own render() and
     * toggle it with their own `open` boolean, wiring clicks on data-act="how-open" / "how-close".
     */
    sheet(open, bodyHtml) {
      return `<div class="sheet-overlay ${open ? 'open' : ''}" data-act="how-close"></div>
      <aside class="sheet ${open ? 'open' : ''}" aria-label="How it works" aria-hidden="${open ? 'false' : 'true'}">
        <div class="sheet-head"><h2>How it works</h2><button class="btn sm" type="button" data-act="how-close">Close</button></div>
        <div class="sheet-body">${bodyHtml}</div>
      </aside>`;
    },
    /** A small floating button that opens the How-it-works sheet. */
    howBtn() {
      return `<button class="how-btn" type="button" data-act="how-open">How it works</button>`;
    },
    /** Confetti burst for a win. */
    celebrate() {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const cols = ['var(--g)', 'var(--y)', 'var(--blue)', 'var(--red)'];
      const box = document.createElement('div');
      box.className = 'confetti';
      let s = '';
      for (let i = 0; i < 44; i++) {
        s += `<i style="left:${(Math.random() * 100).toFixed(1)}%;background:${cols[i % 4]};animation-delay:${(Math.random() * .5).toFixed(2)}s;animation-duration:${(1.1 + Math.random() * .7).toFixed(2)}s"></i>`;
      }
      box.innerHTML = s;
      document.body.appendChild(box);
      setTimeout(() => box.remove(), 2400);
    },
  };

  WG.tabs = [];

  WG.start = function () {
    WG.G = WG.buildGraph(WG.WORDS);
    WG.T = WG.buildTrie(WG.WORDS);
    WG.FREQ = WG.letterFrequencies(WG.WORDS);
    WG.H = WG.huffman(WG.FREQ);

    const dl = document.createElement('datalist');
    dl.id = 'wordlist';
    dl.innerHTML = WG.WORDS.map((w) => `<option value="${w.toUpperCase()}">`).join('');
    document.body.appendChild(dl);

    const shell = document.getElementById('shell');
    const home = document.getElementById('home');
    const back = document.getElementById('back');
    const title = document.getElementById('game-title');
    const stage = document.getElementById('stage');
    const mounted = {};

    WG.renderHome(home);

    function go(id) {
      const t = WG.tabs.find((x) => x.id === id);
      if (!t) { shell.dataset.screen = 'home'; document.body.classList.remove('full'); if (location.hash) location.hash = ''; return; }
      shell.dataset.screen = 'game';
      // A `full` screen draws its own top bar and fills the viewport, so hide the shell's chrome.
      shell.dataset.chrome = t.full ? 'off' : 'on';
      document.body.classList.toggle('full', !!t.full);
      title.textContent = (WG.GAMES.find((g) => g.id === id) || t).name;
      Object.keys(mounted).forEach((k) => { mounted[k].hidden = k !== id; });
      if (!mounted[id]) {
        const el = document.createElement('section');
        el.className = t.full ? 'screen' : 'panel'; el.id = 'panel-' + id;
        stage.appendChild(el);
        t.mount(el);
        mounted[id] = el;
      }
      if (location.hash.slice(1) !== id) location.hash = id;
    }

    document.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
    back.addEventListener('click', () => go(''));
    window.addEventListener('hashchange', () => go((location.hash || '').slice(1)));
    go((location.hash || '').slice(1));
  };
})(self.WG = self.WG || {});
