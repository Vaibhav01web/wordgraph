/* Tab: Huffman coding (prefix codes, Unit III). */
(function (WG) {
  const U = WG.ui;
  WG.tabs.push({ id: 'huffman', name: 'Huffman', unit: 'III', mount });

  function mount(root) {
    const H = WG.H, F = WG.FREQ;
    const S = { text: 'graph theory is everywhere', sel: 'e' };
    const total = Object.values(F).reduce((a, b) => a + b, 0);
    const dictBits = Object.entries(F).reduce((s, [c, f]) => s + f * H.codes[c].length, 0);

    // Layout: leaves spaced evenly in left-to-right order, parents centred above children.
    let leaves = 0, depth = 0;
    (function lay(n, d) { n.d = d; depth = Math.max(depth, d); if (n.sym !== undefined) { n.x = leaves++; return; } lay(n.left, d + 1); lay(n.right, d + 1); n.x = (n.left.x + n.right.x) / 2; })(H.root, 0);

    function treeSVG() {
      const SX = 42, SY = 46, W = leaves * SX + 10, Ht = depth * SY + 70;
      const px = (n) => 26 + n.x * SX, py = (n) => 22 + n.d * SY;
      const code = H.codes[S.sel] || '';
      const onPath = new Set();
      let n = H.root; onPath.add(n);
      for (const b of code) { n = b === '0' ? n.left : n.right; onPath.add(n); }
      let e = '', nodes = '';
      (function walk(n) {
        if (n.sym !== undefined) return;
        [[n.left, '0'], [n.right, '1']].forEach(([c, bit]) => {
          const hot = onPath.has(n) && onPath.has(c);
          e += `<line x1="${px(n)}" y1="${py(n)}" x2="${px(c)}" y2="${py(c)}" style="stroke:${hot ? 'var(--blue)' : 'var(--line)'};stroke-width:${hot ? 3 : 1.3}"/>`;
          e += `<text x="${(px(n) + px(c)) / 2 + (bit === '0' ? -7 : 7)}" y="${(py(n) + py(c)) / 2 + 3}" text-anchor="middle" style="font:700 10px var(--mono);fill:${hot ? 'var(--blue)' : 'var(--muted)'}">${bit}</text>`;
          walk(c);
        });
      })(H.root);
      (function draw(n) {
        const hot = onPath.has(n);
        if (n.sym !== undefined) {
          nodes += `<g data-sym="${n.sym}" style="cursor:pointer"><title>${n.sym.toUpperCase()}: ${H.codes[n.sym]}</title><rect x="${px(n) - 15}" y="${py(n) - 15}" width="30" height="30" rx="4" style="fill:${hot ? 'var(--blue)' : 'var(--g)'}"/>
            <text x="${px(n)}" y="${py(n) + 5}" text-anchor="middle" style="font:800 14px var(--mono);fill:#fff">${n.sym.toUpperCase()}</text>
            <text x="${px(n)}" y="${py(n) + 28}" text-anchor="middle" style="font:500 9px var(--mono);fill:var(--muted)">${U.fmt(n.w)}</text></g>`;
          return;
        }
        nodes += `<circle cx="${px(n)}" cy="${py(n)}" r="${hot ? 5 : 4}" style="fill:${hot ? 'var(--blue)' : 'var(--ink)'}"/>`;
        draw(n.left); draw(n.right);
      })(H.root);
      return `<div class="scroll"><svg viewBox="0 0 ${W} ${Ht}" width="${W}" style="max-width:none;display:block" role="img" aria-label="Huffman tree of letter frequencies">${e}${nodes}</svg></div>`;
    }

    function decode(bits) {
      let out = '', n = H.root;
      for (const b of bits) { n = b === '0' ? n.left : n.right; if (n.sym !== undefined) { out += n.sym; n = H.root; } }
      return out;
    }

    function results() {
      const letters = [...S.text.toLowerCase()].filter((c) => c >= 'a' && c <= 'z');
      if (!letters.length) return '<p class="dim">Type some letters to encode.</p>';
      const codes = letters.map((c) => H.codes[c]), bits = codes.join(''), fixed = letters.length * 5;
      return `<div class="stats three"><div><b>${fixed}</b><span>Bits with a fixed 5-bit code</span></div><div><b>${bits.length}</b><span>Bits with Huffman</span></div><div><b>${Math.round((1 - bits.length / fixed) * 100)}%</b><span>Smaller</span></div></div>
        <div><h3 style="margin-bottom:6px">Encoded (one shade per letter)</h3><div class="bits">${codes.map((c, i) => `<i title="${letters[i].toUpperCase()}">${c}</i>`).join('')}</div></div>
        <p>Decoded back from the bits alone: <b style="font-family:var(--mono);text-transform:uppercase">${U.esc(decode(bits))}</b> <span class="ok">✓</span> No separators were needed because no code is the start of another.</p>`;
    }

    function render() {
      const rows = Object.entries(F).sort((a, b) => b[1] - a[1]).map(([c, f]) => `<tr data-sym="${c}" style="cursor:pointer;${c === S.sel ? 'background:var(--tint)' : ''}"><td class="m"><b>${c.toUpperCase()}</b></td><td class="m">${U.fmt(f)}</td><td class="m">${H.codes[c]}</td><td class="m">${H.codes[c].length}</td></tr>`).join('');
      root.innerHTML = `<div class="card">
        <h2>Huffman coding</h2>
        ${U.pills([['Prefix codes', 'III'], ['Huffman tree', 'III']])}
        <p class="lead">Every letter normally costs 5 bits. Huffman gives common letters short codes and rare letters long ones, using how often each letter appears in all ${U.fmt(WG.WORDS.length)} words.</p>
        <div class="field"><label class="lbl" for="hf-in">Type a message</label><textarea id="hf-in" spellcheck="false">${U.esc(S.text)}</textarea></div>
        <div id="hf-out" style="display:grid;gap:12px">${results()}</div>
        <div class="stats"><div><b>${U.fmt(total * 5)}</b><span>Bits to store every letter of the word list at 5 bits each</span></div><div><b>${U.fmt(dictBits)}</b><span>With Huffman (${Math.round((1 - dictBits / (total * 5)) * 100)}% smaller, ${(dictBits / total).toFixed(2)} bits per letter)</span></div></div>
        <p class="note">Build: repeatedly merge the two least frequent nodes, O(n log n) for n = 26 letters. Encode and decode: one tree walk per letter.</p>
      </div>
      <div class="card">
        <h2>The Huffman tree</h2>
        <p class="lead">Each leaf is a letter with its count. Left edges are 0, right edges are 1, so a letter's code is its path from the root. Click a letter to trace it: <b style="font-family:var(--mono)">${S.sel.toUpperCase()} = ${H.codes[S.sel]}</b>.</p>
        ${treeSVG()}
        <div class="scroll" style="max-height:320px;overflow:auto"><table><tr><th>Letter</th><th>Count</th><th>Code</th><th>Bits</th></tr>${rows}</table></div>
      </div>`;
    }

    root.addEventListener('input', (e) => { if (e.target.id === 'hf-in') { S.text = e.target.value; root.querySelector('#hf-out').innerHTML = results(); } });
    root.addEventListener('click', (e) => { const s = e.target.closest('[data-sym]'); if (s) { S.sel = s.dataset.sym; render(); } });
    render();
  }
})(self.WG = self.WG || {});
