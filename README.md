# WordGraph

The maths behind Wordle and word games: a Discrete Structures model covering Unit III (trees) and Unit IV (graph theory).

## Run it

Open `index.html` in any browser. No install, no server, no internet needed (fonts fall back to system fonts when offline).

`dist/wordgraph.html` is the same app bundled into one file, handy for sharing or putting on a pen drive.

## What's inside

| Tab | Concept | Unit | Code |
|---|---|---|---|
| Wordle solver | Decision tree (minimax guess choice) | III | `core/solver.js`, `ui/solver.js` |
| Word ladder | Dijkstra (keyboard-distance weights) and BFS | IV | `core/dijkstra.js`, `ui/ladder.js` |
| Autocomplete | Prefix tree (trie), tree properties | III | `core/trie.js`, `ui/trie.js` |
| Critical words | Cut sets, bridges, cut vertices, connectivity (Tarjan) | III / IV | `core/bridges.js`, `ui/critical.js` |
| Huffman | Prefix codes, Huffman tree | III | `core/huffman.js`, `ui/huffman.js` |
| Graph facts | Handshaking lemma, degree, representation, Euler, planarity, cliques and colouring bounds | IV | `ui/facts.js` |

The word graph itself (vertices = words, edges = one-letter differences) is built in `core/graph.js` using wildcard buckets (`c_ld`), which is much faster than comparing every pair.

## Project layout

```
index.html          page shell, loads the scripts in order
style.css           all styling (light and dark themes)
data/words.js       generated word list + precomputed solver stats (do not edit by hand)
core/               the algorithms, no UI code
ui/                 one file per tab
tools/words5.txt    source word list (one word per line)
tools/build-data.js regenerates data/words.js      ->  node tools/build-data.js
tools/bundle.js     builds dist/wordgraph.html      ->  node tools/bundle.js
```

Everything is plain JavaScript with no framework. Every file attaches to one global object, `WG`.

## Changing things

- **Word list:** edit `tools/words5.txt`, then run `node tools/build-data.js` (recomputes the solver's first guess and whole-tree stats, a few seconds) and `node tools/bundle.js`.
- **A new tab:** copy one of the `ui/*.js` files, push a new entry to `WG.tabs`, and add its `<script>` tag to `index.html` before the final `WG.start()` line.
- After any change, run `node tools/bundle.js` to refresh the single-file version.

## Publishing

Push this folder to a GitHub repository, then deploy it free with GitHub Pages (Settings → Pages → deploy from branch) or Vercel (import the repo; no build command, output directory is the repo root).

## Data credits

Common 5-letter words from `popular.txt` in [dolph/dictionary](https://github.com/dolph/dictionary): the public-domain ENABLE word list filtered by Wiktionary frequency lists. Plurals, simple past tenses and offensive words were removed, leaving 2,187 words.
