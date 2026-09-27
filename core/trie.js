/*
 * WordGraph core: prefix tree (trie) for autocomplete.
 * Each node is one letter; the path from the root spells a prefix.
 * Words that start the same share the same path, so shared prefixes are stored once.
 * Lookup of a prefix of length k: O(k). Listing the m matching words: O(m · L).
 */
(function (WG) {
  class TrieNode {
    constructor(letter) { this.letter = letter; this.children = new Map(); this.count = 0; this.word = null; }
  }

  class Trie {
    constructor() { this.root = new TrieNode(''); this.nodes = 1; }
    insert(word) {
      let node = this.root;
      node.count++;
      for (const ch of word) {
        if (!node.children.has(ch)) { node.children.set(ch, new TrieNode(ch)); this.nodes++; }
        node = node.children.get(ch);
        node.count++;
      }
      node.word = word;
    }
    /** Returns the chain of nodes for the prefix (root first), or null if no word starts with it. */
    walk(prefix) {
      const chain = [this.root];
      let node = this.root;
      for (const ch of prefix) {
        node = node.children.get(ch);
        if (!node) return null;
        chain.push(node);
      }
      return chain;
    }
    collect(node, limit) {
      const out = [];
      (function dfs(n) {
        if (out.length >= limit) return;
        if (n.word) out.push(n.word);
        [...n.children.keys()].sort().forEach((k) => dfs(n.children.get(k)));
      })(node);
      return out;
    }
  }

  WG.Trie = Trie;
  WG.buildTrie = function (words) {
    const t = new Trie();
    words.forEach((w) => t.insert(w));
    return t;
  };
})(self.WG = self.WG || {});
