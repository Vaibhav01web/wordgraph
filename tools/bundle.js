/*
 * Bundles the project into one self-contained file: dist/wordgraph.html
 * (inlines style.css and every <script src>). Useful for sharing a single file.
 *
 *   node tools/bundle.js
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, f) => `<style>\n${fs.readFileSync(path.join(root, f), 'utf8')}</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, f) => `<script>\n${fs.readFileSync(path.join(root, f), 'utf8').replace(/<\/script/gi, '<\\/script')}</script>`);
html = html.replace(/<!doctype html>\n<meta charset="utf-8">\n/, '').replace(/<meta name="viewport"[^>]*>\n/, '');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'wordgraph.html'), html);
console.log('wrote dist/wordgraph.html', (html.length / 1024).toFixed(0) + ' KB');
