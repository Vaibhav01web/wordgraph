/* Screen: Guess my word (Wordle solver; decision tree, Unit III). */
(function (WG) {
  const U = WG.ui;
  WG.tabs.push({ id: 'solver', name: 'Guess my word', unit: 'III', full: true, mount });

  const ROWS = 6;
  const COLOUR = ['x', 'y', 'g'];
  const COLOUR_NAME = ['grey', 'yellow', 'green'];

  function mount(root) {
    const S = { mode: 'think', rows: [], cands: [], cur: null, solved: false, msg: '', secret: '', animate: false, how: false, flip: -1, won: false };
    function reset() {
      S.rows = []; S.cands = WG.WORDS.slice(); S.solved = false; S.msg = ''; S.fix = null; S.flip = -1;
      S.cur = { guess: WG.META.first, tiles: [0, 0, 0, 0, 0], worst: WG.META.firstWorst, groups: WG.META.firstGroups };
    }

    /** Apply feedback for the current guess. Returns false when no word fits the colours. */
    function submit(tiles) {
      const g = S.cur.guess, p = WG.encodePattern(tiles);
      const part = WG.partition(g, S.cands), group = part.get(p) || [];
      if (!group.length) {
        S.msg = `No word gives those colours for ${g.toUpperCase()}.`;
        S.fix = findFix(tiles);
        return false;
      }
      S.fix = null;
      const sizes = [...part.values()].map((a) => a.length).sort((a, b) => b - a);
      S.rows.push({ guess: g, tiles: tiles.slice(), before: S.cands.length, sizes, chosen: group.length, groups: part.size, prevCands: S.cands, prevCur: S.cur });
      S.msg = ''; S.flip = S.rows.length - 1;
      if (p === WG.ALL_GREEN) { S.solved = true; S.won = true; S.cands = [g]; S.cur = null; return true; }
      S.cands = group;
      const nb = WG.bestGuess(group, WG.WORDS);
      const next = [0, 0, 0, 0, 0];
      for (let i = 0; i < 5; i++) if (tiles[i] === 2 && nb.guess[i] === g[i]) next[i] = 2; // keep known greens
      S.cur = { guess: nb.guess, tiles: next, worst: nb.worst, groups: nb.groups };
      return true;
    }
    function undo() {
      const r = S.rows.pop(); if (!r) return;
      S.cands = r.prevCands; S.cur = { ...r.prevCur, tiles: r.tiles.slice() }; S.solved = false; S.msg = ''; S.flip = -1;
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

    function board() {
      const rows = S.rows.map((r, k) => {
        const anim = S.animate || S.flip === k;
        return `<div class="wrow">${[...r.guess].map((ch, i) => {
          const delay = S.animate ? (k * 5 + i) * 80 : i * 80;
          return `<span class="wtile ${COLOUR[r.tiles[i]]}${anim ? ' pop' : ''}" style="animation-delay:${anim ? delay : 0}ms">${U.esc(ch)}</span>`;
        }).join('')}</div>`;
      });
      if (S.cur && !S.solved && S.mode === 'think') {
        rows.push(`<div class="wrow">${[...S.cur.guess].map((ch, i) =>
          `<button type="button" class="wtile live ${COLOUR[S.cur.tiles[i]]}" data-tile="${i}" aria-label="${ch.toUpperCase()}: ${COLOUR_NAME[S.cur.tiles[i]]}, tap to change">${U.esc(ch)}</button>`).join('')}</div>`);
      }
      while (rows.length < ROWS) rows.push(`<div class="wrow">${'<span class="wtile empty"></span>'.repeat(5)}</div>`);
      return `<div class="wboard">${rows.join('')}</div>`;
    }

    function counter() {
      const total = U.fmt(WG.WORDS.length), now = U.fmt(S.cands.length);
      return `<div class="counter">${S.rows.length ? `${total} <span class="arrow">→</span> ${now}` : total}
        <small>${S.solved ? 'the answer' : 'words still possible'}</small></div>`;
    }

    function popup() {
      if (!S.msg) return '';
      const body = S.fix && S.cur ? (() => {
        const byRow = {};
        S.fix.changes.forEach((c) => { (byRow[c.row] = byRow[c.row] || []).push(`${c.letter.toUpperCase()} → ${COLOUR_NAME[c.to]}`); });
        const lines = Object.keys(byRow).map((k) => `<li>Row ${+k + 1} (${S.fix.rows[k].guess.toUpperCase()}): <b>${byRow[k].join(', ')}</b></li>`).join('');
        return `<p>Looks like a tapping slip. Fix it?</p><ul>${lines}</ul>
          <button class="btn primary sm" type="button" data-act="fix">Use this fix</button>`;
      })() : '<p class="dim">Check each tile against your word and try again.</p>';
      return `<div class="popup" role="alert"><button class="popup-x" type="button" data-act="dismiss" aria-label="Dismiss">✕</button>
        <p class="warn">${U.esc(S.msg)}</p>${body}</div>`;
    }

    function hint() {
      if (S.solved) return `Solved in ${S.rows.length} guess${S.rows.length === 1 ? '' : 'es'}.`;
      if (S.msg) return '';
      return S.mode === 'think' ? 'Pick a secret word. Tap tiles to colour them.' : 'Type a word and watch it get solved.';
    }

    function bottom() {
      if (S.mode === 'think') {
        return `<button class="icon-btn" type="button" data-act="undo" aria-label="Undo last guess" title="Undo" ${S.rows.length ? '' : 'disabled'}>↶</button>
          <button class="big-btn" type="button" data-act="next" ${S.solved ? 'disabled' : ''}>Next</button>
          <button class="icon-btn" type="button" data-act="new" aria-label="New game" title="New game">⟳</button>`;
      }
      return `<input id="sv-secret" class="word-in" type="text" maxlength="5" list="wordlist" value="${U.esc(S.secret.toUpperCase())}" autocomplete="off" aria-label="Secret word">
        <button class="big-btn" type="button" data-act="solve">Solve it</button>
        <button class="icon-btn" type="button" data-act="random" aria-label="Random word" title="Random word">🎲</button>`;
    }

    /** Everything a viva needs: the concept, the tree, the numbers and the complexity. */
    function how() {
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
      return U.sheet(S.how, `
        ${U.pills([['Decision tree', 'III']])}
        <p>Think of any 5-letter word and keep it secret. For each guess, tap the tiles to match the colours Wordle would give, then press Next. Every guess is a node; its feedback is one of 3⁵ = 243 colour patterns, so each node can branch up to 243 ways. The answers are the leaves.</p>
        <div class="legend"><span><i style="background:var(--g)"></i>right letter, right spot</span><span><i style="background:var(--y)"></i>in the word, wrong spot</span><span><i style="background:var(--x)"></i>not in the word</span></div>
        <div><h3 style="margin-bottom:6px">Your path down the tree</h3><p style="font:600 15px var(--mono)">${path}</p></div>
        ${steps ? `<div class="steps">${steps}</div>` : `<p class="dim">Give feedback on the first guess, ${WG.META.first.toUpperCase()}, to start down the tree. Bars will show how that guess splits all ${U.fmt(WG.WORDS.length)} words.</p>`}
        ${nextInfo}${cands}
        <div style="display:grid;gap:8px">
          <h3>Whole tree, tested on every word</h3>
          <div class="stats three"><div><b>${T.height}</b><span>Tree height: most guesses ever needed</span></div><div><b>${T.average.toFixed(2)}</b><span>Average guesses</span></div><div><b>${U.fmt(T.internal)}</b><span>Question nodes in the tree</span></div></div>
          ${hist}
        </div>
        <p class="note">Choosing a guess checks every word against every remaining answer: O(W · C) pattern checks for W guesses and C candidates. The first guess (${WG.META.first.toUpperCase()}) is precomputed; later guesses are computed live.</p>`);
    }

    function render() {
      root.innerHTML = `<div class="gs">
        <header class="gs-top">
          <button class="icon-btn back-btn" type="button" data-go="" aria-label="Back to home">←</button>
          <h1 class="gs-title">Guess my word</h1>
          <div class="seg tiny" role="group" aria-label="Mode">
            <button type="button" data-mode="think" aria-pressed="${S.mode === 'think'}">You pick a word</button>
            <button type="button" data-mode="watch" aria-pressed="${S.mode === 'watch'}">Watch it solve</button>
          </div>
          <button class="icon-btn how-icon" type="button" data-act="how-open" aria-label="How it works" title="How it works">?</button>
        </header>
        <main class="gs-main">
          <p class="hint">${U.esc(hint())}</p>
          ${board()}
          ${counter()}
        </main>
        <footer class="gs-bottom">${bottom()}</footer>
        ${popup()}
        ${how()}
      </div>`;
      S.animate = false; S.flip = -1;
      if (S.won) { S.won = false; setTimeout(U.celebrate, 350); }
    }

    root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-tile]');
      if (t && S.cur) { const i = +t.dataset.tile; S.cur.tiles[i] = (S.cur.tiles[i] + 1) % 3; S.msg = ''; S.fix = null; render(); root.querySelector(`[data-tile="${i}"]`)?.focus(); return; }
      const m = e.target.closest('[data-mode]');
      if (m) { S.mode = m.dataset.mode; reset(); if (S.mode === 'watch') watch(S.secret || 'brick'); render(); return; }
      const a = e.target.closest('[data-act]'); if (!a) return;
      const act = a.dataset.act;
      if (act === 'how-open') S.how = true;
      else if (act === 'how-close') S.how = false;
      else if (act === 'dismiss') { S.msg = ''; S.fix = null; }
      else if (act === 'next' && S.cur) submit(S.cur.tiles);
      else if (act === 'fix' && S.fix) applyFix(S.fix);
      else if (act === 'undo') undo();
      else if (act === 'new') reset();
      else if (act === 'solve') {
        const v = U.clean(root.querySelector('#sv-secret').value);
        if (!WG.G.index.has(v)) { reset(); S.secret = v; S.msg = `${v.toUpperCase() || 'That'} is not in the word list.`; }
        else watch(v);
      } else if (act === 'random') watch(WG.WORDS[Math.floor(Math.random() * WG.WORDS.length)]);
      render();
    });
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.id === 'sv-secret') root.querySelector('[data-act="solve"]').click();
      if (e.key === 'Escape' && S.how) { S.how = false; render(); }
    });

    reset(); render();
  }
})(self.WG = self.WG || {});
