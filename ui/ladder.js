/* Tab: Word ladder (Dijkstra and BFS, Unit IV). */
(function (WG) {
  const U = WG.ui;
  WG.tabs.push({ id: 'ladder', name: 'Word ladder', unit: 'IV', mount });

  function mount(root) {
    const G = WG.G;
    const S = { a: WG.META.ladder[0], b: WG.META.ladder[1], guess: '', res: null, msg: '' };

    function run() {
      S.msg = ''; S.res = null;
      if (!G.index.has(S.a) || !G.index.has(S.b)) { S.msg = `${(!G.index.has(S.a) ? S.a : S.b).toUpperCase() || 'That'} is not in the word list.`; return; }
      if (S.a === S.b) { S.msg = 'Pick two different words.'; return; }
      const s = G.index.get(S.a), t = G.index.get(S.b);
      const bfs = WG.bfs(G, s, t), dij = WG.dijkstra(G, s, t);
      let comps = null;
      if (!bfs.path) { const c = WG.components(G.adj); comps = { a: c.sizes[c.comp[s]], b: c.sizes[c.comp[t]] }; }
      S.res = { bfs, dij, comps };
    }
    function randomPair() {
      const c = WG.components(G.adj), big = c.sizes.indexOf(Math.max(...c.sizes));
      for (let tries = 0; tries < 50; tries++) {
        const s = Math.floor(Math.random() * WG.WORDS.length);
        if (c.comp[s] !== big || G.adj[s].length < 2) continue;
        const d = WG.bfsDistances(G, s), far = [];
        d.forEach((x, i) => { if (x >= 5 && x <= 7) far.push(i); });
        if (far.length) { S.a = WG.WORDS[s]; S.b = WG.WORDS[far[Math.floor(Math.random() * far.length)]]; return; }
      }
    }
    const cost = (path) => path.slice(1).reduce((sum, v, i) => sum + WG.edgeWeight(G.words[path[i]], G.words[v]), 0);

    function ladderHTML(path) {
      return `<div class="ladder">${path.map((v, i) => {
        const w = G.words[v];
        if (i === 0) return U.word(w, 'sm');
        const prev = G.words[path[i - 1]], p = WG.diffPos(prev, w);
        return `<div class="rung">${prev[p].toUpperCase()} → ${w[p].toUpperCase()} · key distance ${WG.edgeWeight(prev, w).toFixed(2)}</div>${U.word(w, 'sm', p)}`;
      }).join('')}</div>`;
    }

    function render() {
      const r = S.res;
      let out = '';
      if (S.msg) out = `<p class="warn">${U.esc(S.msg)}</p>`;
      else if (r && !r.bfs.path) out = `<p class="warn">No ladder exists.</p><p>${S.a.toUpperCase()} is in a connected component of ${U.fmt(r.comps.a)} word${r.comps.a === 1 ? '' : 's'}, and ${S.b.toUpperCase()} is in a different component of ${U.fmt(r.comps.b)}. No path can cross between components.</p>`;
      else if (r) {
        const steps = r.bfs.path.length - 1, dSteps = r.dij.path.length - 1, same = r.bfs.path.join() === r.dij.path.join();
        const g = parseInt(S.guess, 10);
        const verdict = Number.isFinite(g) ? `<p>${g === steps ? '<span class="ok">Exactly right.</span>' : g > steps ? `<span class="ok">It's shorter than you thought:</span> ${steps} steps, not ${g}.` : `<span class="warn">Impossible:</span> the shortest ladder needs ${steps} steps.`}</p>` : '';
        out = `${verdict}
        <div class="stats three"><div><b>${steps}</b><span>Fewest steps (BFS)</span></div><div><b>${r.dij.cost.toFixed(2)}</b><span>Least typing effort (Dijkstra)</span></div><div><b>${U.fmt(r.dij.settled)}</b><span>Words settled by Dijkstra</span></div></div>
        <div class="ladders">
          <div><h3 style="margin-bottom:8px">Fewest steps · ${steps}</h3>${ladderHTML(r.bfs.path)}<p class="dim" style="font-size:13px;margin-top:6px">Effort ${cost(r.bfs.path).toFixed(2)}</p></div>
          <div><h3 style="margin-bottom:8px">Least effort · ${dSteps} steps</h3>${ladderHTML(r.dij.path)}<p class="dim" style="font-size:13px;margin-top:6px">Effort ${r.dij.cost.toFixed(2)}</p></div>
        </div>
        <p>${same ? 'Here the shortest ladder is also the easiest to type.' : `The easiest ladder to type is <b>not</b> the shortest: it takes ${dSteps - steps} extra step${dSteps - steps === 1 ? '' : 's'} but saves ${(cost(r.bfs.path) - r.dij.cost).toFixed(2)} key-widths of finger travel. That is why a weighted graph needs Dijkstra, not BFS.`}</p>`;
      }
      root.innerHTML = `<div class="card">
        <h2>Word ladder</h2>
        ${U.pills([['Dijkstra', 'IV'], ['Shortest path', 'IV']])}
        <p class="lead">Change one letter at a time; every step must be a real word. Each word is a vertex, and one-letter changes are edges.</p>
        <div class="row">
          <div class="field"><label class="lbl" for="ld-a">From</label><input id="ld-a" type="text" maxlength="5" list="wordlist" value="${S.a.toUpperCase()}" autocomplete="off"></div>
          <div class="field"><label class="lbl" for="ld-b">To</label><input id="ld-b" type="text" maxlength="5" list="wordlist" value="${S.b.toUpperCase()}" autocomplete="off"></div>
          <div class="field"><label class="lbl" for="ld-g">Your guess</label><input id="ld-g" type="number" min="1" max="30" placeholder="steps" value="${U.esc(S.guess)}"></div>
        </div>
        <div class="row"><button class="btn primary" type="button" data-act="go">Find ladders</button><button class="btn" type="button" data-act="swap">Swap</button><button class="btn" type="button" data-act="rand">Random challenge</button></div>
        <p class="dim" style="font-size:14px"><b>Edge weights:</b> the distance between the old and new letter on a QWERTY keyboard. Swapping to a neighbouring key costs 1.00; E → M costs ${WG.keyDistance('e', 'm').toFixed(2)}.</p>
        <p class="note">BFS: O(V + E), counts every edge as 1. Dijkstra with a binary heap: O((V + E) log V), handles different edge weights. Dijkstra is correct here because key distances are never negative.</p>
      </div>
      <div class="card"><h2>${S.a.toUpperCase()} → ${S.b.toUpperCase()}</h2>${out || '<p class="dim">Press Find ladders.</p>'}</div>`;
    }

    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      S.a = U.clean(root.querySelector('#ld-a').value); S.b = U.clean(root.querySelector('#ld-b').value); S.guess = root.querySelector('#ld-g').value;
      if (b.dataset.act === 'swap') [S.a, S.b] = [S.b, S.a];
      if (b.dataset.act === 'rand') { randomPair(); S.guess = ''; }
      run(); render();
    });
    root.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('input')) root.querySelector('[data-act="go"]').click(); });
    run(); render();
  }
})(self.WG = self.WG || {});
