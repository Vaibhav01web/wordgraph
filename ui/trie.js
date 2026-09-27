/* Tab: Autocomplete (prefix tree / trie, Unit III). */
(function (WG) {
  const U = WG.ui;
  WG.tabs.push({ id: 'trie', name: 'Autocomplete', unit: 'III', mount });

  function mount(root) {
    const T = WG.T;
    const S = { prefix: 'gr' };
    const letters = WG.WORDS.length * 5;

    function treeSVG(chain) {
      const k = chain.length - 1, last = chain[k];
      const kids = [...last.children.values()].sort((a, b) => b.count - a.count);
      const dx = 96, x0 = 36, rowH = 26;
      const H = Math.max(kids.length * rowH + 30, 150), cy = H / 2;
      const kidX = x0 + (k + 1) * dx + 30, W = kids.length ? kidX + 90 : x0 + k * dx + 90;
      const maxC = Math.max(1, ...kids.map((c) => c.count));
      let s = '';
      chain.forEach((n, i) => { if (i) s += `<line x1="${x0 + (i - 1) * dx}" y1="${cy}" x2="${x0 + i * dx}" y2="${cy}" style="stroke:var(--y);stroke-width:4"/>`; });
      kids.forEach((c, j) => {
        const y = 20 + j * rowH + (H - 30 - kids.length * rowH) / 2 + rowH / 2;
        s += `<line x1="${x0 + k * dx}" y1="${cy}" x2="${kidX}" y2="${y}" style="stroke:var(--line);stroke-width:1.5"/>`;
      });
      chain.forEach((n, i) => {
        const x = x0 + i * dx;
        s += `<circle cx="${x}" cy="${cy}" r="17" style="fill:var(--y)"/><text x="${x}" y="${cy + 5}" text-anchor="middle" style="font:700 15px var(--mono);fill:#fff">${i ? n.letter.toUpperCase() : '•'}</text>`;
        s += `<text x="${x}" y="${cy + 34}" text-anchor="middle" style="font:500 11px var(--mono);fill:var(--muted)">${U.fmt(n.count)}</text>`;
      });
      kids.forEach((c, j) => {
        const y = 20 + j * rowH + (H - 30 - kids.length * rowH) / 2 + rowH / 2, r = 7 + 5 * Math.sqrt(c.count / maxC);
        s += `<g data-letter="${c.letter}" style="cursor:pointer"><title>Add ${c.letter.toUpperCase()}</title><rect x="${kidX - 14}" y="${y - 12}" width="84" height="24" style="fill:transparent"/><circle cx="${kidX}" cy="${y}" r="${r.toFixed(1)}" style="fill:var(--surface);stroke:var(--ink);stroke-width:1.5"/>
          <text x="${kidX}" y="${y + 4}" text-anchor="middle" style="font:700 11px var(--mono);fill:var(--ink)">${c.letter.toUpperCase()}</text>
          <text x="${kidX + 20}" y="${y + 4}" style="font:500 11px var(--mono);fill:var(--muted)">${U.fmt(c.count)}${c.word ? ' ✓' : ''}</text></g>`;
      });
      return `<div class="scroll"><svg viewBox="0 0 ${W} ${H}" width="${W}" style="max-width:none;display:block" role="img" aria-label="Prefix tree branch for ${U.esc(S.prefix)}">${s}</svg></div>`;
    }

    function render(keepFocus) {
      const chain = T.walk(S.prefix);
      const node = chain ? chain[chain.length - 1] : null;
      const sugg = node ? T.collect(node, 40) : [];
      const right = !chain
        ? `<p class="warn">No word starts with ${S.prefix.toUpperCase()}.</p><p class="dim">The walk from the root stopped: there is no child for the letter ${S.prefix.slice(-1).toUpperCase()}. That dead end is found in O(k) steps for a k-letter prefix.</p>`
        : `<p class="lead">Yellow is the path you typed, one node per letter. The numbers count how many words pass through each node. Grey nodes are the letters that can come next; click one to extend the prefix.</p>
           ${treeSVG(chain)}
           ${node.word ? `<p class="ok">${node.word.toUpperCase()} is a complete word (a leaf at depth 5).</p>` : ''}`;
      root.innerHTML = `<div class="card">
        <h2>Autocomplete</h2>
        ${U.pills([['Prefix tree (trie)', 'III'], ['Tree properties', 'III']])}
        <p class="lead">Phone keyboards store words in a prefix tree. Words that start the same share one path, so typing a few letters jumps straight to every matching word.</p>
        <div class="field"><label class="lbl" for="tr-in">Start typing</label><input id="tr-in" type="text" maxlength="5" value="${S.prefix.toUpperCase()}" autocomplete="off" spellcheck="false"></div>
        <div><div class="big">${node ? U.fmt(node.count) : 0}<small>matching word${node && node.count === 1 ? '' : 's'}</small></div></div>
        <div class="chips">${sugg.map((w) => `<button type="button" class="chip" data-word="${w}">${w}</button>`).join('')}${node && node.count > sugg.length ? `<span class="dim" style="font-size:13px;align-self:center">+${U.fmt(node.count - sugg.length)} more</span>` : ''}</div>
        <div class="stats"><div><b>${U.fmt(letters)}</b><span>Letters in ${U.fmt(WG.WORDS.length)} words</span></div><div><b>${U.fmt(T.nodes - 1)}</b><span>Trie nodes needed (${Math.round((1 - (T.nodes - 1) / letters) * 100)}% saved by shared prefixes)</span></div></div>
        <p class="note">Find a prefix: O(k) for k letters. List m matches: O(m · L). Height of this trie = 5, because every word has 5 letters.</p>
      </div>
      <div class="card"><h2>Prefix tree · ${S.prefix ? S.prefix.toUpperCase() + '…' : 'root'}</h2>${right}</div>`;
      if (keepFocus) { const i = root.querySelector('#tr-in'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
    }

    root.addEventListener('input', (e) => { if (e.target.id === 'tr-in') { S.prefix = U.clean(e.target.value); render(true); } });
    root.addEventListener('click', (e) => {
      const w = e.target.closest('[data-word]'); if (w) { S.prefix = w.dataset.word; render(); return; }
      const l = e.target.closest('[data-letter]'); if (l && S.prefix.length < 5) { S.prefix += l.dataset.letter; render(); }
    });
    render();
  }
})(self.WG = self.WG || {});
