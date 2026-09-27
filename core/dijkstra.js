/*
 * WordGraph core: shortest word ladders.
 *  - bfs():      fewest steps (every edge counts as 1). O(V + E).
 *  - dijkstra(): least typing effort, edges weighted by keyboard distance. O((V + E) log V) with a binary heap.
 * Both return the path as a list of vertex ids, or null when the target is in another component.
 */
(function (WG) {
  class MinHeap {
    constructor() { this.a = []; }
    get size() { return this.a.length; }
    push(item) {
      const a = this.a; a.push(item);
      let i = a.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (a[p][0] <= a[i][0]) break;
        [a[p], a[i]] = [a[i], a[p]]; i = p;
      }
    }
    pop() {
      const a = this.a, top = a[0], last = a.pop();
      if (a.length) {
        a[0] = last;
        let i = 0;
        for (;;) {
          const l = 2 * i + 1, r = l + 1;
          let m = i;
          if (l < a.length && a[l][0] < a[m][0]) m = l;
          if (r < a.length && a[r][0] < a[m][0]) m = r;
          if (m === i) break;
          [a[m], a[i]] = [a[i], a[m]]; i = m;
        }
      }
      return top;
    }
  }
  WG.MinHeap = MinHeap;

  function tracePath(prev, s, t) {
    const path = [t];
    while (path[path.length - 1] !== s) path.push(prev[path[path.length - 1]]);
    return path.reverse();
  }

  WG.bfs = function (G, s, t) {
    const n = G.adj.length, prev = new Int32Array(n).fill(-1), seen = new Uint8Array(n);
    const queue = [s]; seen[s] = 1;
    for (let h = 0; h < queue.length; h++) {
      const u = queue[h];
      if (u === t) return { path: tracePath(prev, s, t), visited: h + 1 };
      for (const v of G.adj[u]) if (!seen[v]) { seen[v] = 1; prev[v] = u; queue.push(v); }
    }
    return { path: null, visited: queue.length };
  };

  /** All BFS distances from s (used to pick random ladder challenges). */
  WG.bfsDistances = function (G, s) {
    const dist = new Int32Array(G.adj.length).fill(-1), queue = [s]; dist[s] = 0;
    for (let h = 0; h < queue.length; h++) {
      const u = queue[h];
      for (const v of G.adj[u]) if (dist[v] < 0) { dist[v] = dist[u] + 1; queue.push(v); }
    }
    return dist;
  };

  WG.dijkstra = function (G, s, t) {
    const n = G.adj.length, dist = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n);
    const heap = new MinHeap();
    dist[s] = 0; heap.push([0, s]);
    let settled = 0;
    while (heap.size) {
      const [d, u] = heap.pop();
      if (done[u]) continue;
      done[u] = 1; settled++;
      if (u === t) break;
      for (const v of G.adj[u]) {
        const nd = d + WG.edgeWeight(G.words[u], G.words[v]);
        if (nd < dist[v]) { dist[v] = nd; prev[v] = u; heap.push([nd, v]); }
      }
    }
    if (dist[t] === Infinity) return { path: null, settled };
    return { path: tracePath(prev, s, t), cost: dist[t], settled };
  };
})(self.WG = self.WG || {});
