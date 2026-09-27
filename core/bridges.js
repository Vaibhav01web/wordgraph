/*
 * WordGraph core: critical words.
 * Tarjan's DFS with discovery times (tin) and low-links (low), written iteratively
 * so deep searches never overflow the call stack. O(V + E).
 *
 *  - Bridge u–v: removing the edge disconnects the graph (a cut set of size 1). Test: low[v] > tin[u].
 *  - Cut vertex v: removing the word disconnects the graph. Non-root test: some child c has low[c] >= tin[v].
 *    Root test: the root has 2 or more DFS children.
 *  - cutOff[v]: how many words end up separated from the largest remaining piece if v is removed.
 */
(function (WG) {
  WG.criticalWords = function (adj) {
    const n = adj.length;
    const tin = new Int32Array(n).fill(-1), low = new Int32Array(n), size = new Int32Array(n);
    const parent = new Int32Array(n).fill(-1), it = new Int32Array(n);
    const sep = new Map(); // v -> sizes of child subtrees that would separate
    const bridges = [], cutVertices = [];
    let t = 0;
    for (let s = 0; s < n; s++) {
      if (tin[s] >= 0) continue;
      const order = [];
      const stack = [s];
      tin[s] = low[s] = t++; size[s] = 1; order.push(s);
      while (stack.length) {
        const v = stack[stack.length - 1];
        if (it[v] < adj[v].length) {
          const w = adj[v][it[v]++];
          if (tin[w] < 0) {
            parent[w] = v; tin[w] = low[w] = t++; size[w] = 1; order.push(w); stack.push(w);
          } else if (w !== parent[v]) {
            low[v] = Math.min(low[v], tin[w]);
          }
        } else {
          stack.pop();
          const p = parent[v];
          if (p >= 0) {
            low[p] = Math.min(low[p], low[v]);
            size[p] += size[v];
            if (low[v] > tin[p]) bridges.push({ u: p, v, side: size[v] });
            if (low[v] >= tin[p]) { if (!sep.has(p)) sep.set(p, []); sep.get(p).push(size[v]); }
          }
        }
      }
      const C = size[s];
      for (const b of bridges) if (b.compSize === undefined && tin[b.u] >= tin[s]) { b.compSize = C; b.side = Math.min(b.side, C - b.side); }
      for (const v of order) {
        const parts = sep.get(v);
        if (!parts) continue;
        const pieces = v === s ? parts.slice() : parts.concat([C - 1 - parts.reduce((a, b) => a + b, 0)]).filter((x) => x > 0);
        if (pieces.length >= 2) {
          const total = pieces.reduce((a, b) => a + b, 0);
          cutVertices.push({ v, pieces: pieces.length, cutOff: total - Math.max(...pieces) });
        }
      }
    }
    cutVertices.sort((a, b) => b.cutOff - a.cutOff || a.v - b.v);
    return { bridges, cutVertices };
  };
})(self.WG = self.WG || {});
