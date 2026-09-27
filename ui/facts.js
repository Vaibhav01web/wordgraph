/* Tab: Graph facts (terminology, handshaking lemma, representation, Euler, planarity, colouring bounds; Unit IV). */
(function (WG) {
  const U = WG.ui;
  WG.tabs.push({ id: 'facts', name: 'Graph facts', unit: 'IV', mount });

  function mount(root) {
    const G = WG.G, adj = G.adj, V = adj.length, E = G.edges;
    const deg = adj.map((l) => l.length), sum = deg.reduce((a, b) => a + b, 0);
    const odd = deg.filter((d) => d % 2).length, maxDeg = Math.max(...deg);
    const hubs = G.words.filter((_, i) => deg[i] === maxDeg);
    const comps = WG.components(adj), edgeComps = comps.sizes.filter((s) => s > 1).length;
    let clique = { key: '', words: [] };
    G.buckets.forEach((b, key) => { if (b.length > clique.words.length) clique = { key, words: b.map((i) => G.words[i]) }; });
    const hist = new Array(maxDeg + 1).fill(0); deg.forEach((d) => hist[d]++);
    const S = { word: G.index.has('light') ? 'light' : G.words[deg.indexOf(maxDeg)] };

    function histSVG() {
      const W = 620, H = 180, max = Math.max(...hist), bw = (W - 40) / hist.length;
      let s = '';
      for (let y = 0; y <= 4; y++) { const v = Math.round((max * y) / 4), yy = H - 24 - ((H - 44) * y) / 4; s += `<line x1="34" x2="${W}" y1="${yy}" y2="${yy}" style="stroke:var(--line);stroke-width:1"/><text x="28" y="${yy + 3}" text-anchor="end" style="font:10px var(--mono);fill:var(--muted)">${v}</text>`; }
      hist.forEach((v, d) => {
        const h = ((H - 44) * v) / max, x = 36 + d * bw;
        s += `<rect x="${x.toFixed(1)}" y="${(H - 24 - h).toFixed(1)}" width="${Math.max(bw - 2, 1).toFixed(1)}" height="${h.toFixed(1)}" rx="1" style="fill:${d % 2 ? 'var(--y)' : 'var(--g)'}"><title>degree ${d}: ${v} words</title></rect>`;
        if (d % 2 === 0 || hist.length < 16) s += `<text x="${(x + bw / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle" style="font:10px var(--mono);fill:var(--muted)">${d}</text>`;
      });
      return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Degree distribution">${s}</svg>`;
    }

    function lookup() {
      const i = G.index.get(S.word);
      if (i === undefined) return `<p class="warn">${U.esc(S.word.toUpperCase()) || 'That'} is not in the word list.</p>`;
      const w = G.words[i], groups = [];
      for (let p = 0; p < 5; p++) {
        const key = w.slice(0, p) + '_' + w.slice(p + 1);
        const others = G.buckets.get(key).filter((j) => j !== i).map((j) => G.words[j]);
        if (others.length) groups.push(`<div><span class="pill">${key.toUpperCase()}</span> <span style="font:13px var(--mono)">${others.map((o) => o.toUpperCase()).join(', ')}</span></div>`);
      }
      return `<p><b style="font-family:var(--mono)">${w.toUpperCase()}</b> has degree <b>${deg[i]}</b>${deg[i] % 2 ? ' (odd)' : ' (even)'}.</p>
        <div style="display:grid;gap:6px">${groups.join('') || '<p class="dim">No neighbours: an isolated vertex.</p>'}</div>
        <p class="dim" style="font-size:13px">This is its adjacency list, grouped by the letter that changes. Each group is a clique: all its words are neighbours of each other too.</p>`;
    }

    function render() {
      const cells = V * V, filled = 2 * E;
      root.innerHTML = `<div class="card">
        <h2>Graph facts</h2>
        ${U.pills([['Terminology & representation', 'IV'], ['Handshaking lemma', 'IV'], ['Euler · planar · colouring', 'IV']])}
        <p class="lead">Live numbers for the whole word graph: ${U.fmt(V)} words as vertices, one-letter changes as edges.</p>
        <div class="stats">
          <div><b>${U.fmt(V)}</b><span>Vertices (words)</span></div><div><b>${U.fmt(E)}</b><span>Edges (one-letter links)</span></div>
          <div><b>${U.fmt(sum)} = 2 × ${U.fmt(E)}</b><span>Handshaking lemma: sum of degrees <span class="ok">✓</span></span></div><div><b>${U.fmt(odd)}</b><span>Odd-degree vertices: always an even number <span class="ok">✓</span></span></div>
          <div><b>${(sum / V).toFixed(2)}</b><span>Average degree</span></div><div><b>${maxDeg}</b><span>Highest degree: ${hubs.slice(0, 3).map((h) => h.toUpperCase()).join(', ')}</span></div>
        </div>
        <p><b>Euler path?</b> <span class="warn">No.</span> ${edgeComps > 1 ? `The edges are spread over ${U.fmt(edgeComps)} separate components, and` : ''} ${U.fmt(odd)} vertices have odd degree. An Euler path needs a connected graph with 0 or 2 odd vertices.</p>
        <p><b>Cliques:</b> words in the bucket <span class="pill">${clique.key.toUpperCase()}</span> (${clique.words.map((w) => w.toUpperCase()).join(', ')}) are all one letter apart, forming K<sub>${clique.words.length}</sub>.</p>
        <p><b>Planar?</b> <span class="warn">No.</span> K<sub>${clique.words.length}</sub> contains K<sub>5</sub>, so by Kuratowski's theorem the graph cannot be drawn without crossings, even though E ≤ 3V − 6 holds (${U.fmt(E)} ≤ ${U.fmt(3 * V - 6)}). That test is necessary, not sufficient.</p>
        <p><b>Colouring bound:</b> the clique needs ${clique.words.length} different colours, so the chromatic number is at least ${clique.words.length}. <b>Bipartite?</b> No: any 3 words in one bucket form a triangle, an odd cycle.</p>
        <p><b>Representation:</b> an adjacency matrix would need ${U.fmt(cells)} cells with only ${U.fmt(filled)} ones (${((filled / cells) * 100).toFixed(2)}% filled). An adjacency list stores just the ${U.fmt(filled)} entries: O(V + E) instead of O(V²).</p>
      </div>
      <div class="card">
        <h2>Degree distribution</h2>
        <p class="lead">How many words have each number of one-letter neighbours. Yellow bars are odd degrees.</p>
        ${histSVG()}
        <div class="field"><label class="lbl" for="gf-in">Look up a word's neighbours</label><div class="row"><input id="gf-in" type="text" maxlength="5" list="wordlist" value="${S.word.toUpperCase()}" autocomplete="off"><button class="btn sm" type="button" data-act="look">Show</button></div></div>
        <div id="gf-out" style="display:grid;gap:10px">${lookup()}</div>
      </div>`;
    }
    root.addEventListener('click', (e) => { const a = e.target.closest('[data-act="look"]'); if (a) { S.word = U.clean(root.querySelector('#gf-in').value); root.querySelector('#gf-out').innerHTML = lookup(); } });
    root.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'gf-in') root.querySelector('[data-act="look"]').click(); });
    render();
  }
})(self.WG = self.WG || {});
