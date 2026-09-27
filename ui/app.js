/* WordGraph UI: shared helpers, tab registry and start-up. */
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

    const nav = document.getElementById('tabs'), host = document.getElementById('panels');
    const mounted = {};
    function show(id) {
      WG.tabs.forEach((t) => {
        const on = t.id === id;
        nav.querySelector(`[data-tab="${t.id}"]`).setAttribute('aria-selected', on);
        if (on && !mounted[t.id]) {
          const el = document.createElement('section');
          el.className = 'panel'; el.id = 'panel-' + t.id; el.setAttribute('role', 'tabpanel');
          host.appendChild(el); t.mount(el); mounted[t.id] = el;
        }
        if (mounted[t.id]) mounted[t.id].hidden = !on;
      });
    }
    nav.innerHTML = WG.tabs.map((t) => `<button class="tab" type="button" role="tab" data-tab="${t.id}" aria-selected="false">${esc(t.name)}<small>U-${t.unit}</small></button>`).join('');
    nav.addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) show(b.dataset.tab); });
    const hash = (location.hash || '').slice(1);
    show(WG.tabs.some((t) => t.id === hash) ? hash : WG.tabs[0].id);
  };
})(self.WG = self.WG || {});
