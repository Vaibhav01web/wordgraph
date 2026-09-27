/* Tab: Wordle solver (decision tree, Unit III). */
(function (WG) {
  const U = WG.ui;
  WG.tabs.push({ id: 'solver', name: 'Wordle solver', unit: 'III', mount });

  function mount(root) {
    const S = { mode: 'think', rows: [], cands: [], cur: null, solved: false, msg: '', secret: '', animate: false, drawerOpen: false };
    function reset() {
      S.rows = []; S.cands = WG.WORDS.slice(); S.solved = false; S.msg = ''; S.fix = null;
      S.cur = { guess: WG.META.first, tiles: [0, 0, 0, 0, 0], worst: WG.META.firstWorst, groups: WG.META.firstGroups };
    }

    /** Apply feedback for the current guess. Returns false when no word fits the colours. */
    function submit(tiles) {
      const g = S.cur.guess, p = WG.encodePattern(tiles);
      const part = WG.partition(g, S.cands), group = part.get(p) || [];
      if (!group.length) {
        S.msg = `No word in the list gives those colours for ${g.toUpperCase()}.`;
        S.fix = findFix(tiles);
        return false;
      }
      S.fix = null;
      const sizes = [...part.values()].map((a) => a.length).sort((a, b) => b - a);
      S.rows.push({ guess: g, tiles: tiles.slice(), before: S.cands.length, sizes, chosen: group.length, groups: part.size, prevCands: S.cands, prevCur: S.cur });
      S.msg = '';
      if (p === WG.ALL_GREEN) { S.solved = true; S.cands = [g]; S.cur = null; return true; }
      S.cands = group;
      const nb = WG.bestGuess(group, WG.WORDS);
      const next = [0, 0, 0, 0, 0];
      for (let i = 0; i < 5; i++) if (tiles[i] === 2 && nb.guess[i] === g[i]) next[i] = 2; // keep known greens
      S.cur = { guess: nb.guess, tiles: next, worst: nb.worst, groups: nb.groups };
      return true;
    }
    function undo() {
      const r = S.rows.pop(); if (!r) return;
      S.cands = r.prevCands; S.cur = { ...r.prevCur, tiles: r.tiles.slice() }; S.solved = false; S.msg = '';
    }

    /**
     * A tapping mistake can be in any earlier row, not just the current one.
     * Check every word: how many tiles, across all rows, would have to change for it to fit?
     * The words needing the fewest changes are the likely secret words.
     */
    function findFix(curTiles) {
      const rows = S.rows.map((r) => ({ guess: r.guess, tiles: r.tiles })).concat([{ guess: S.cur.guess, tiles: curTiles }]);
      let bestDiff = Infinity, words = [];
      for (const w of WG.WORDS) {
        let diff = 0;
        for (const r of rows) {
          const t = WG.decodePattern(WG.pattern(r.guess, w));
          for (let i = 0; i < 5; i++) if (t[i] !== r.tiles[i]) diff++;
          if (diff > bestDiff) break;
        }
        if (diff < bestDiff) { bestDiff = diff; words = [w]; } else if (diff === bestDiff) words.push(w);
      }
      if (bestDiff > 3) return null;
      const w = words[0];
      const changes = [];
      rows.forEach((r, k) => {
        const t = WG.decodePattern(WG.pattern(r.guess, w));
        t.forEach((x, i) => { if (x !== r.tiles[i]) changes.push({ row: k, letter: r.guess[i], to: x }); });
      });
      return { words, word: w, changes, rows: rows.map((r) => ({ guess: r.guess, tiles: WG.decodePattern(WG.pattern(r.guess, w)) })) };
    }

    /** Replays the game with corrected colours, keeping the same guessed words. */
    function applyFix(fix) {
      reset();
      const last = fix.rows.length - 1;
      fix.rows.forEach((r, k) => {
        S.cur = { ...S.cur, guess: r.guess, tiles: r.tiles.slice() };
        if (k < last) submit(r.tiles);
      });
      S.fix = null; S.msg = '';
    }
    function watch(secret) {
      reset(); S.secret = secret;
      while (!S.solved && S.rows.length < 10) submit(WG.decodePattern(WG.pattern(S.cur.guess, secret)));
      S.animate = true;
    }

    function left() {
      const rows = S.rows.map((r, k) => `<div class="trow">${[...r.guess].map((ch, i) => U.tile(ch, r.tiles[i], S.animate ? 'pop' : '').replace('class="tile', `style="animation-delay:${S.animate ? (k * 5 + i) * 90 : 0}ms" class="tile`)).join('')}<span class="meta">${U.fmt(r.before)} → ${U.fmt(r.chosen)}</span></div>`).join('');
      const live = S.mode === 'think' && S.cur ? `<div class="trow" aria-label="Current guess: tap tiles to set colours">${[...S.cur.guess].map((ch, i) => `<button type="button" class="tile live ${['x', 'y', 'g'][S.cur.tiles[i]]}" data-tile="${i}" aria-label="${ch.toUpperCase()}: ${['grey', 'yellow', 'green'][S.cur.tiles[i]]}">${U.esc(ch)}</button>`).join('')}<span class="meta">tap to colour</span></div>` : '';
      const status = S.solved
        ? `<p class="ok">Solved in ${S.rows.length} guess${S.rows.length === 1 ? '' : 'es'}: ${S.rows[S.rows.length - 1].guess.toUpperCase()}</p>`
        : S.msg ? `<div style="display:grid;gap:8px"><p class="warn">${U.esc(S.msg)}</p>${S.fix && S.cur ? (() => {
            const names = ['grey', 'yellow', 'green'];
            const byRow = {};
            S.fix.changes.forEach((c) => { (byRow[c.row] = byRow[c.row] || []).push(`${c.letter.toUpperCase()} should be ${names[c.to]}`); });
            const lines = Object.keys(byRow).map((k) => `<li>Row ${+k + 1} (${S.fix.rows[k].guess.toUpperCase()}): <b>${byRow[k].join(', ')}</b></li>`).join('');
            const ws = S.fix.words.slice(0, 6).map((w) => w.toUpperCase()).join(', ');
            return `<p>Probably a tapping mistake. The closest fit is <b>${ws}</b>${S.fix.words.length > 6 ? '…' : ''} if you change:</p><ul style="margin:0;padding-left:20px">${lines}</ul><div class="row"><button class="btn sm primary" type="button" data-act="fix">Use this fix</button></div><p class="dim" style="font-size:13px">Tip: green means the letter is in that exact spot. Yellow means it is in the word but somewhere else.</p>`;
          })() : '<p class="dim">Check each tile against your word and try again.</p>'}</div>`
        : S.mode === 'think' ? `<div class="big">${U.fmt(S.cands.length)}<small>word${S.cands.length === 1 ? '' : 's'} still possible</small></div>` : '';
      const controls = S.mode === 'think'
        ? `<div class="row"><button class="btn primary" type="button" data-act="next" ${S.solved ? 'disabled' : ''}>Next guess</button><button class="btn" type="button" data-act="undo" ${S.rows.length ? '' : 'disabled'}>Undo</button><button class="btn" type="button" data-act="new">New game</button></div>`
        : `<div class="row"><div class="field"><label class="lbl" for="sv-secret">Secret word</label><input id="sv-secret" type="text" maxlength="5" list="wordlist" value="${U.esc(S.secret.toUpperCase())}" autocomplete="off"></div>
           <button class="btn primary" type="button" data-act="solve" style="align-self:end">Solve it</button><button class="btn" type="button" data-act="random" style="align-self:end">Random word</button></div>`;
      return `<div class="card">
        <div class="row" style="justify-content:space-between;align-items:flex-start;flex-wrap:wrap">
          <div style="display:grid;gap:10px"><h2>Wordle solver</h2>${U.pills([['Decision tree', 'III']])}</div>
          <button class="btn sm" type="button" data-act="tree-open">View decision tree</button>
        </div>
        <p class="lead">${S.mode === 'think'
          ? 'Think of any 5-letter word and keep it secret. For each guess, tap the tiles to match the colours Wordle would give, then press Next guess.'
          : 'Type a secret word and watch the solver find it. Each guess is a question; each colour pattern is a branch.'}</p>
        <div class="seg" role="group" aria-label="Mode"><button type="button" data-mode="think" aria-pressed="${S.mode === 'think'}">You pick a word</button><button type="button" data-mode="watch" aria-pressed="${S.mode === 'watch'}">Watch it solve</button></div>
        ${controls}
        <div class="board">${rows}${live}</div>
        ${status}
        <div class="legend"><span><i style="background:var(--g)"></i>right letter, right spot</span><span><i style="background:var(--y)"></i>in the word, wrong spot</span><span><i style="background:var(--x)"></i>not in the word</span></div>
      </div>`;
    }

    function right() {
      const path = [WG.WORDS.length, ...S.rows.map((r) => r.chosen)].map(U.fmt).join(' → ');
      const steps = S.rows.map((r, k) => `<div class="step">
        <div class="step-h"><b>Guess ${k + 1} · ${r.guess}</b><span>${U.fmt(r.before)} words → ${r.groups} branches · largest ${U.fmt(r.sizes[0])}</span></div>
        ${U.bars(r.sizes, r.chosen)}
        <p class="dim" style="font-size:13px">The colours led down a branch of <b style="color:var(--blue)">${U.fmt(r.chosen)}</b> word${r.chosen === 1 ? '' : 's'}.</p></div>`).join('');
      const nextInfo = S.cur && !S.solved && S.mode === 'think'
        ? `<div class="step" style="background:var(--surface)"><div class="step-h"><b>Next question · ${S.cur.guess}</b><span>worst branch ≤ ${U.fmt(S.cur.worst)} word${S.cur.worst === 1 ? '' : 's'}</span></div>
           <p class="dim" style="font-size:13px">Chosen from all ${U.fmt(WG.WORDS.length)} words because its largest branch is the smallest possible (minimax).</p></div>` : '';
      const cands = !S.solved && S.cands.length > 1 && S.cands.length <= 60
        ? `<div><h3 style="margin-bottom:8px">Still possible</h3><div class="chips">${S.cands.map((w) => `<span class="chip">${w}</span>`).join('')}</div></div>` : '';
      const T = WG.META.tree, maxD = Math.max(...Object.values(T.dist));
      const hist = Object.keys(T.dist).sort((a, b) => a - b).map((d) => {
        const v = T.dist[d], w = Math.max(2, (v / maxD) * 100);
        return `<div style="display:grid;grid-template-columns:9ch 1fr 6ch;gap:8px;align-items:center;font:12px var(--mono)"><span>${d} guess${d === '1' ? '' : 'es'}</span><span style="height:12px;width:${w}%;background:var(--g);border-radius:2px"></span><span>${U.fmt(v)}</span></div>`;
      }).join('');
      return `<p class="lead">Every guess is a node. Its feedback is one of 3⁵ = 243 colour patterns, so each node can branch up to 243 ways. The answers are the leaves.</p>
        <div><h3 style="margin-bottom:6px">Your path down the tree</h3><p style="font:600 15px var(--mono)">${path}</p></div>
        ${steps ? `<div class="steps">${steps}</div>` : `<p class="dim">Give feedback on the first guess, ${WG.META.first.toUpperCase()}, to start down the tree. Bars will show how that guess splits all ${U.fmt(WG.WORDS.length)} words.</p>`}
        ${nextInfo}${cands}
        <div style="display:grid;gap:8px">
          <h3>Whole tree, tested on every word</h3>
          <div class="stats three"><div><b>${T.height}</b><span>Tree height: most guesses ever needed</span></div><div><b>${T.average.toFixed(2)}</b><span>Average guesses</span></div><div><b>${U.fmt(T.internal)}</b><span>Question nodes in the tree</span></div></div>
          ${hist}
        </div>
        <p class="note">Choosing a guess checks every word against every remaining answer: O(W · C) pattern checks for W guesses and C candidates. The first guess (${WG.META.first.toUpperCase()}) is precomputed; later guesses are computed live.</p>`;
    }

    function drawer() {
      return `<div class="drawer-overlay ${S.drawerOpen ? 'open' : ''}" data-act="tree-close"></div>
      <aside class="drawer ${S.drawerOpen ? 'open' : ''}" aria-label="Decision tree" aria-hidden="${S.drawerOpen ? 'false' : 'true'}">
        <div class="drawer-head"><h2>The decision tree</h2><button class="btn sm" type="button" data-act="tree-close" aria-label="Close decision tree">Close</button></div>
        ${right()}
      </aside>`;
    }

    function render() { root.innerHTML = left() + drawer(); S.animate = false; }

    root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-tile]');
      if (t && S.cur) { const i = +t.dataset.tile; S.cur.tiles[i] = (S.cur.tiles[i] + 1) % 3; S.msg = ''; S.fix = null; render(); root.querySelector(`[data-tile="${i}"]`)?.focus(); return; }
      const m = e.target.closest('[data-mode]');
      if (m) { S.mode = m.dataset.mode; reset(); if (S.mode === 'watch') watch(S.secret || 'brick'); render(); return; }
      const a = e.target.closest('[data-act]'); if (!a) return;
      const act = a.dataset.act;
      if (act === 'tree-open') S.drawerOpen = true;
      else if (act === 'tree-close') S.drawerOpen = false;
      else if (act === 'next' && S.cur) submit(S.cur.tiles);
      else if (act === 'fix' && S.fix) applyFix(S.fix);
      else if (act === 'undo') undo();
      else if (act === 'new') reset();
      else if (act === 'solve') {
        const v = U.clean(root.querySelector('#sv-secret').value);
        if (!WG.G.index.has(v)) { reset(); S.secret = v; S.msg = `${v.toUpperCase() || 'That'} is not in the ${U.fmt(WG.WORDS.length)}-word list. Try another word.`; }
        else watch(v);
      } else if (act === 'random') watch(WG.WORDS[Math.floor(Math.random() * WG.WORDS.length)]);
      render();
    });
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.id === 'sv-secret') root.querySelector('[data-act="solve"]').click();
      if (e.key === 'Escape' && S.drawerOpen) { S.drawerOpen = false; render(); }
    });

    reset(); render();
  }
})(self.WG = self.WG || {});
