/*
 * WordGraph core: Huffman coding of letters.
 * Repeatedly merge the two lowest-frequency nodes until one tree remains.
 * Left edge = 0, right edge = 1. Every letter is a leaf, so no code is a prefix of another.
 * O(n log n) for n symbols with a heap (26 letters here, so a sorted array is enough).
 */
(function (WG) {
  WG.huffman = function (freq) {
    let order = 0;
    let queue = Object.entries(freq)
      .filter(([, f]) => f > 0)
      .map(([sym, f]) => ({ sym, w: f, o: order++ }));
    if (!queue.length) return null;
    const merges = [];
    while (queue.length > 1) {
      queue.sort((a, b) => a.w - b.w || a.o - b.o);
      const a = queue.shift(), b = queue.shift();
      const node = { w: a.w + b.w, left: a, right: b, o: order++ };
      merges.push(node);
      queue.push(node);
    }
    const root = queue[0];
    const codes = {};
    (function walk(n, code) {
      if (n.sym !== undefined) { codes[n.sym] = code || '0'; return; }
      walk(n.left, code + '0');
      walk(n.right, code + '1');
    })(root, '');
    return { root, codes, merges };
  };

  WG.letterFrequencies = function (words) {
    const f = {};
    for (let c = 97; c <= 122; c++) f[String.fromCharCode(c)] = 0;
    words.forEach((w) => { for (const ch of w) f[ch]++; });
    return f;
  };
})(self.WG = self.WG || {});
