/*
 * WordGraph core: the word graph.
 * Vertices = 5-letter words. Edge between two words that differ in exactly one position.
 *
 * Building it the naive way compares every pair: n(n-1)/2 ≈ 2.4 million comparisons.
 * Instead each word goes into 5 "wildcard buckets" (cold → _old, c_ld, co_d, col_).
 * Words that share a bucket differ only at the wildcard, so each bucket is a clique.
 * Two different words can share at most one bucket, so no edge is created twice.
 * Cost: O(n · L) bucket inserts plus the edges themselves.
 */
(function (WG) {
  const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  const KEY_POS = {};
  KEY_ROWS.forEach((row, y) => [...row].forEach((c, x) => { KEY_POS[c] = [x + y * 0.5, y]; }));

  /** Straight-line distance between two keys on a QWERTY keyboard (1 = neighbouring keys). */
  WG.keyDistance = function (a, b) {
    const p = KEY_POS[a], q = KEY_POS[b];
    return Math.hypot(p[0] - q[0], p[1] - q[1]);
  };

  /** Position (0-4) where two neighbouring words differ. */
  WG.diffPos = function (u, v) {
    for (let i = 0; i < u.length; i++) if (u[i] !== v[i]) return i;
    return -1;
  };

  /** Edge weight used by the weighted ladder: how far your finger moves to swap the letter. */
  WG.edgeWeight = function (u, v) {
    const i = WG.diffPos(u, v);
    return Math.round(WG.keyDistance(u[i], v[i]) * 100) / 100;
  };

  WG.buildGraph = function (words) {
    const index = new Map(words.map((w, i) => [w, i]));
    const buckets = new Map();
    words.forEach((w, i) => {
      for (let p = 0; p < w.length; p++) {
        const key = w.slice(0, p) + '_' + w.slice(p + 1);
        let b = buckets.get(key);
        if (!b) buckets.set(key, (b = []));
        b.push(i);
      }
    });
    const adj = words.map(() => []);
    let edges = 0;
    buckets.forEach((b) => {
      for (let i = 0; i < b.length; i++)
        for (let j = i + 1; j < b.length; j++) {
          adj[b[i]].push(b[j]);
          adj[b[j]].push(b[i]);
          edges++;
        }
    });
    return { words, index, adj, edges, buckets };
  };

  /** Connected components with BFS. `removed` (optional) is a vertex treated as deleted. */
  WG.components = function (adj, removed) {
    const n = adj.length, comp = new Int32Array(n).fill(-1), sizes = [];
    for (let s = 0; s < n; s++) {
      if (comp[s] >= 0 || s === removed) continue;
      const id = sizes.length;
      let size = 0;
      const queue = [s];
      comp[s] = id;
      for (let h = 0; h < queue.length; h++) {
        const u = queue[h];
        size++;
        for (const v of adj[u]) if (v !== removed && comp[v] < 0) { comp[v] = id; queue.push(v); }
      }
      sizes.push(size);
    }
    return { comp, sizes };
  };
})(self.WG = self.WG || {});
