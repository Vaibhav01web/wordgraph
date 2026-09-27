/*
 * WordGraph core: the Wordle solver as a decision tree.
 *
 * Every guess is a tree node. Its feedback (green / yellow / grey for each tile) is one of
 * 3^5 = 243 patterns, so each node has up to 243 branches; the answers are the leaves.
 * The solver picks the guess whose largest branch is as small as possible (minimax),
 * which keeps the tree short. Ties: prefer a guess that could itself be the answer,
 * then the guess that makes more branches.
 */
(function (WG) {
  const A = 97;
  WG.GREEN = 2; WG.YELLOW = 1; WG.GREY = 0;
  WG.ALL_GREEN = 242;

  /** Feedback pattern for `guess` against `answer`, encoded as a base-3 number 0..242. Handles repeated letters like Wordle does. */
  WG.pattern = function (guess, answer) {
    const res = [0, 0, 0, 0, 0];
    const left = new Int8Array(26);
    for (let i = 0; i < 5; i++) {
      if (guess.charCodeAt(i) === answer.charCodeAt(i)) res[i] = 2;
      else left[answer.charCodeAt(i) - A]++;
    }
    for (let i = 0; i < 5; i++) {
      if (res[i]) continue;
      const c = guess.charCodeAt(i) - A;
      if (left[c] > 0) { res[i] = 1; left[c]--; }
    }
    return res[0] * 81 + res[1] * 27 + res[2] * 9 + res[3] * 3 + res[4];
  };
  WG.encodePattern = (tiles) => tiles.reduce((s, x) => s * 3 + x, 0);
  WG.decodePattern = function (p) {
    const r = [];
    for (let i = 4; i >= 0; i--) { r[i] = p % 3; p = Math.floor(p / 3); }
    return r;
  };

  /** Split the candidate answers into branches by the feedback `guess` would produce. */
  WG.partition = function (guess, cands) {
    const m = new Map();
    for (const a of cands) {
      const p = WG.pattern(guess, a);
      let b = m.get(p);
      if (!b) m.set(p, (b = []));
      b.push(a);
    }
    return m;
  };

  WG.bestGuess = function (cands, pool) {
    if (cands.length <= 2) return { guess: cands[0], worst: 1, groups: cands.length };
    const inCands = new Set(cands);
    const cnt = new Int32Array(243);
    let best = null;
    for (const g of pool) {
      cnt.fill(0);
      let worst = 0, groups = 0;
      for (const a of cands) {
        const p = WG.pattern(g, a);
        if (cnt[p]++ === 0) groups++;
        if (cnt[p] > worst) worst = cnt[p];
        if (best && worst > best.worst) break; // can't beat the current best
      }
      if (best && worst > best.worst) continue;
      const isC = inCands.has(g);
      if (!best || worst < best.worst ||
          (worst === best.worst && ((isC && !best.isC) || (isC === best.isC && groups > best.groups)))) {
        best = { guess: g, worst, groups, isC };
      }
      if (best.worst === 1 && best.isC) break;
    }
    return best;
  };

  /** Plays the solver against every possible answer and returns the tree's shape (used for the stats panel). */
  WG.solveAll = function (words, first) {
    const dist = {};
    let total = 0, height = 0, internal = 0;
    (function node(cands, depth, guess) {
      internal++;
      const g = guess || WG.bestGuess(cands, words).guess;
      WG.partition(g, cands).forEach((group, p) => {
        if (p === WG.ALL_GREEN) {
          dist[depth + 1] = (dist[depth + 1] || 0) + 1;
          total += depth + 1;
          height = Math.max(height, depth + 1);
        } else node(group, depth + 1, null);
      });
    })(words, 0, first);
    return { dist, height, average: total / words.length, internal };
  };
})(self.WG = self.WG || {});
