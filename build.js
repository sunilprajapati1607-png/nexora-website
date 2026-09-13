#!/usr/bin/env node
/* Nexora website build — assembles src/pages/**.html + src/partials into static pages at the repo root.
   Usage:  node build.js            (build)
           node build.js --serve    (build, then serve on http://localhost:5173 with Vercel-style clean URLs) */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const PAGES = path.join(SRC, 'pages');
const PARTIALS = path.join(SRC, 'partials');
const SITE = 'https://nexoraofficial.org';
const BUILD_ID = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');

const partials = {};
for (const f of fs.readdirSync(PARTIALS)) partials[path.basename(f, '.html')] = fs.readFileSync(path.join(PARTIALS, f), 'utf8');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function parseFront(src) {
  const m = src.match(/^\s*<!--\s*([\s\S]*?)-->/);
  const meta = {};
  if (!m) return { meta, body: src };
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: src.slice(m[0].length) };
}

function render(tpl, vars) {
  // partials first (they may contain vars), then vars — loop until stable
  let out = tpl, prev;
  do {
    prev = out;
    out = out.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, n) => {
      if (!(n in partials)) throw new Error('Unknown partial: ' + n);
      return partials[n];
    });
  } while (out !== prev);
  return out.replace(/\{\{\s*([\w]+)\s*\}\}/g, (_, k) => (k in vars ? vars[k] : ''));
}

const urls = [];
for (const file of walk(PAGES)) {
  const rel = path.relative(PAGES, file).replace(/\\/g, '/');           // e.g. products/erp.html
  const { meta, body } = parseFront(fs.readFileSync(file, 'utf8'));
  const urlPath = rel === 'index.html' ? '/' : '/' + rel.replace(/\.html$/, '').replace(/\/index$/, '');
  const vars = Object.assign({
    title: 'Nexora',
    description: '',
    path: urlPath,
    bodyClass: '',
    build: BUILD_ID
  }, meta);
  const html = render(body, vars);
  const outFile = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, html);
  if (rel !== '404.html' && meta.sitemap !== 'false') urls.push({ loc: SITE + urlPath, priority: meta.priority || '0.7' });
  console.log('built', rel, '->', urlPath);
}

// sitemap
const today = new Date().toISOString().slice(0, 10);
const sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
for (const u of urls) sm.push(`  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>${u.priority}</priority></url>`);
sm.push('</urlset>', '');
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sm.join('\n'));
console.log('sitemap.xml:', urls.length, 'urls');

// optional dev server with clean URLs (mirrors vercel.json cleanUrls: true)
if (process.argv.includes('--serve')) {
  const http = require('http');
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain', '.json': 'application/json' };
  const port = process.env.PORT || 5173;
  http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    if (p.endsWith('/')) p += 'index.html';
    let f = path.join(ROOT, p);
    if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f = f + '.html';
    else if (fs.existsSync(f) && fs.statSync(f).isDirectory() && fs.existsSync(path.join(f, 'index.html'))) f = path.join(f, 'index.html');
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { f = path.join(ROOT, '404.html'); res.statusCode = 404; }
    res.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream');
    fs.createReadStream(f).pipe(res);
  }).listen(port, () => console.log('serving http://localhost:' + port));
}
