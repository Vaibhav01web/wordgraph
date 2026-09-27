/* Home screen: the WordGraph logo, one big card per game, and the examiners' link. */
(function (WG) {
  const GAMES = [
    { id: 'solver', icon: '🟩', name: 'Guess my word' },
    { id: 'ladder', icon: '🪜', name: 'Word ladder' },
    { id: 'trie', icon: '⌨️', name: 'Autocomplete' },
    { id: 'critical', icon: '🕸️', name: 'Break the network' },
    { id: 'huffman', icon: '🗜️', name: 'Squeeze it' },
  ];
  WG.GAMES = GAMES;

  WG.renderHome = function (root) {
    root.innerHTML = `
      <div class="logo" aria-label="WordGraph">
        <span style="background:var(--g)">W</span><span style="background:var(--y)">O</span><span style="background:var(--x)">R</span><span style="background:var(--g)">D</span><span class="gap"></span><span class="o">G</span><span class="o">R</span><span class="o">A</span><span class="o">P</span><span class="o">H</span>
      </div>
      <div class="cards">${GAMES.map((g) => `<button class="game-card" type="button" data-go="${g.id}"><span class="g-icon">${g.icon}</span><span class="g-name">${WG.ui.esc(g.name)}</span></button>`).join('')}</div>
      <button class="examiners" type="button" data-go="facts">For examiners →</button>`;
  };
})(self.WG = self.WG || {});
