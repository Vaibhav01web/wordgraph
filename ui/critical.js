/* Tab: Critical words (cut sets, bridges and connectivity, Units III and IV). */
(function (WG) {
  const U = WG.ui;
  WG.tabs.push({ id: 'critical', name: 'Critical words', unit: 'III/IV', mount });

  function mount(root) {
    const G = WG.G, adj = G.adj;
    const crit = WG.criticalWords(adj);
    const comps = WG.components(adj);
    const cutOf = new Map(crit.cutVertices.map((c) => [c.v, c]));
    const isolated = adj.filter((l) => !l.length).length;
    const largest = Math.max(...comps.sizes);
    const S = { v: crit.cutVertices[0].v, removed: false, msg: '' };

    function ego(v) {
      const r1 = adj[v].slice(0, 22), set1 = new Set(r1), r2 = [], parentOf = new Map();
      for (const u of r1) {
        let k = 0;
        for (const w of adj[u]) {
          if (w === v || set1.has(w) || parentOf.has(w)) continue;
          parentOf.set(w, u); r2.push(w);
          if (++k >= 3 || r2.length >= 36) break;
        }
        if (r2.length >= 36) break;
      }
      return { r1, r2, parentOf, more: adj[v].length - r1.length };
    }

    function svg() {
      const v = S.v, { r1, r2, parentOf, more } = ego(v);
      const cx = 330, cy = 235, R1 = 118, R2 = 200, pos = new Map([[v, [cx, cy]]]);
      const ang = new Map();
      r1.forEach((u, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(r1.length, 1); ang.set(u, a); pos.set(u, [cx + R1 * Math.cos(a), cy + R1 * Math.sin(a)]); });
      const byParent = new Map();
      r2.forEach((w) => { const p = parentOf.get(w); if (!byParent.has(p)) byParent.set(p, []); byParent.get(p).push(w); });
      byParent.forEach((list, p) => list.forEach((w, j) => { const a = ang.get(p) + (j - (list.length - 1) / 2) * 0.21; pos.set(w, [cx + R2 * Math.cos(a), cy + R2 * Math.sin(a)]); }));

      let label = null, main = -1, pieces = [];
      if (S.removed) {
        const c = WG.components(adj, v);
        label = c.comp;
        const ids = [...new Set(adj[v].map((u) => c.comp[u]))];
        main = ids.reduce((m, id) => (m < 0 || c.sizes[id] > c.sizes[m] ? id : m), -1);
        pieces = ids.filter((id) => id !== main).map((id) => ({ id, size: c.sizes[id], words: G.words.filter((_, i) => c.comp[i] === id).slice(0, 14) }));
      }
      const colour = (u) => !label ? 'var(--surface)' : label[u] === main ? 'var(--tint)' : 'var(--tint-red)';
      const strokeC = (u) => !label ? 'var(--ink)' : label[u] === main ? 'var(--blue)' : 'var(--red)';

      let s = '';
      const line = (a, b, st) => { const p = pos.get(a), q = pos.get(b); s += `<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" style="${st}"/>`; };
      for (let i = 0; i < r1.length; i++) for (let j = i + 1; j < r1.length; j++) if (adj[r1[i]].includes(r1[j])) line(r1[i], r1[j], 'stroke:var(--line);stroke-width:1');
      r2.forEach((w) => line(parentOf.get(w), w, 'stroke:var(--line);stroke-width:1'));
      if (!S.removed) r1.forEach((u) => line(v, u, 'stroke:var(--y);stroke-width:2'));
      const node = (u, r, big) => {
        const [x, y] = pos.get(u);
        s += `<g data-word="${u}" style="cursor:pointer"><title>${G.words[u].toUpperCase()} · degree ${adj[u].length}</title><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" style="fill:${colour(u)};stroke:${strokeC(u)};stroke-width:1.5"/>
          <text x="${x.toFixed(1)}" y="${(y + (big ? 5 : 3.5)).toFixed(1)}" text-anchor="middle" style="font:${big ? 700 : 600} ${big ? 13 : 9.5}px var(--mono);fill:var(--ink);text-transform:uppercase">${G.words[u].toUpperCase()}</text></g>`;
      };
      r2.forEach((w) => node(w, 17));
      r1.forEach((u) => node(u, 20));
      const [x, y] = pos.get(v);
      s += `<circle cx="${x}" cy="${y}" r="30" style="fill:${S.removed ? 'var(--surface)' : 'var(--y)'};stroke:${S.removed ? 'var(--muted)' : 'var(--y)'};stroke-width:2;${S.removed ? 'stroke-dasharray:4 4' : ''}"/>
        <text x="${x}" y="${y + 5}" text-anchor="middle" style="font:800 14px var(--mono);fill:${S.removed ? 'var(--muted)' : '#fff'};${S.removed ? 'text-decoration:line-through' : ''}">${G.words[v].toUpperCase()}</text>`;
      if (more > 0) s += `<text x="${cx}" y="458" text-anchor="middle" style="font:11px var(--mono);fill:var(--muted)">+${more} more neighbours not drawn</text>`;
      return { html: `<div class="scroll"><svg viewBox="0 0 660 466" width="100%" style="min-width:520px;display:block" role="img" aria-label="Neighbourhood of ${G.words[v]}">${s}</svg></div>`, pieces };
    }

    function render() {
      const v = S.v, info = cutOf.get(v), deg = adj[v].length, g = svg();
      const bridgeHere = crit.bridges.filter((b) => b.u === v || b.v === v);
      let verdict;
      if (!deg) verdict = `<p><b>${G.words[v].toUpperCase()}</b> has no one-letter neighbours: it is an isolated vertex, a component on its own.</p>`;
      else if (!info) verdict = `<p><b>${G.words[v].toUpperCase()}</b> is <b>not</b> a cut vertex. Removing it leaves its ${deg} neighbours connected through other words.</p>`;
      else verdict = `<p><b>${G.words[v].toUpperCase()}</b> is a <span class="warn">cut vertex</span>. Removing it splits the network into ${info.pieces} pieces and cuts off ${U.fmt(info.cutOff)} word${info.cutOff === 1 ? '' : 's'}.</p>`;
      if (bridgeHere.length) verdict += `<p>Bridge${bridgeHere.length > 1 ? 's' : ''} at this word: ${bridgeHere.map((b) => `${G.words[b.u].toUpperCase()}–${G.words[b.v].toUpperCase()}`).join(', ')}. Each is a cut set of size one.</p>`;
      const removedText = S.removed ? (g.pieces.length
        ? g.pieces.map((p) => `<p><span class="warn">Cut off (${U.fmt(p.size)}):</span> ${p.words.map((w) => w.toUpperCase()).join(', ')}${p.size > p.words.length ? '…' : ''}</p>`).join('')
        : `<p class="ok">Still connected. Every neighbour can reach the others without ${G.words[v].toUpperCase()}.</p>`) : '';
      root.innerHTML = `<div class="card">
        <h2>Critical words</h2>
        ${U.pills([['Cut sets', 'III'], ['Connectivity', 'IV']])}
        <p class="lead">Words joined by one-letter changes form one big network plus small islands. Some words are the only link between two groups: remove one and the network splits.</p>
        <div class="stats"><div><b>${U.fmt(comps.sizes.length)}</b><span>Connected components</span></div><div><b>${U.fmt(largest)}</b><span>Words in the largest component</span></div>
          <div><b>${U.fmt(isolated)}</b><span>Isolated words (degree 0)</span></div><div><b>${U.fmt(crit.cutVertices.length)} · ${U.fmt(crit.bridges.length)}</b><span>Cut vertices · bridges</span></div></div>
        <div class="field"><label class="lbl" for="cr-in">Inspect any word</label><div class="row"><input id="cr-in" type="text" maxlength="5" list="wordlist" autocomplete="off" placeholder="word"><button class="btn sm" type="button" data-act="look">Show</button></div>${S.msg ? `<p class="warn">${U.esc(S.msg)}</p>` : ''}</div>
        <div><h3 style="margin-bottom:8px">Most critical words</h3><div class="list">${crit.cutVertices.slice(0, 10).map((c) => `<button type="button" data-word="${c.v}" aria-pressed="${c.v === v}">${G.words[c.v]}<span>cuts off ${U.fmt(c.cutOff)}</span></button>`).join('')}</div></div>
        <p class="note">Tarjan's DFS finds every bridge and cut vertex in one pass, O(V + E). A vertex v is a cut vertex when some DFS child's subtree has no back edge above v: low[child] ≥ tin[v].</p>
      </div>
      <div class="card">
        <div class="row" style="justify-content:space-between"><h2>${G.words[v].toUpperCase()} <span class="dim" style="font:400 15px var(--body)">degree ${deg}</span></h2>
          <button class="btn ${S.removed ? '' : 'primary'}" type="button" data-act="toggle" ${deg ? '' : 'disabled'}>${S.removed ? 'Put it back' : 'Remove this word'}</button></div>
        ${verdict}${removedText}
        ${deg ? g.html : ''}
        <p class="dim" style="font-size:13px">Yellow: the selected word. After removal, blue neighbours stay in the main network and red ones are cut off. Click any word to inspect it.</p>
      </div>`;
    }

    root.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]');
      if (a && a.dataset.act === 'toggle') { S.removed = !S.removed; render(); return; }
      if (a && a.dataset.act === 'look') {
        const w = U.clean(root.querySelector('#cr-in').value);
        if (G.index.has(w)) { S.v = G.index.get(w); S.removed = false; S.msg = ''; } else S.msg = `${w.toUpperCase() || 'That'} is not in the word list.`;
        render(); return;
      }
      const n = e.target.closest('[data-word]');
      if (n) { S.v = +n.dataset.word; S.removed = false; S.msg = ''; render(); }
    });
    root.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'cr-in') root.querySelector('[data-act="look"]').click(); });
    render();
  }
})(self.WG = self.WG || {});
