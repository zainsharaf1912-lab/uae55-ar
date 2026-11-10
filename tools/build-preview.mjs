// Builds a single self-contained HTML file (dist/preview.html) from the modular source:
// ES modules are wrapped into scoped functions, CSS/fonts/images/JSON are inlined as data URIs.
// three.js still loads from the pinned CDN via the import map.
// Usage: node tools/build-preview.mjs [--artifact]
//   --artifact  omit <!doctype>/<html>/<head>/<body> (the hosting skeleton adds them) and flag preview mode.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ARTIFACT = process.argv.includes('--artifact');
const read = p => fs.readFileSync(path.join(ROOT, p));
const mime = { '.woff': 'font/woff', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json' };
const dataURI = p => `data:${mime[path.extname(p)]};base64,${read(p).toString('base64')}`;

// ---------- JS: tiny module linker ----------
const modules = new Map(); // id -> { code, deps, exports }
const externalImports = new Set();
function load(id) {
  if (modules.has(id)) return;
  let src = read(id).toString();
  const deps = [];
  src = src.replace(/^import\s+([^;]+?)\s+from\s+'([^']+)';\s*$/gm, (m, what, spec) => {
    if (!spec.startsWith('.')) { externalImports.add(m.trim()); return ''; }
    const dep = path.posix.normalize(path.posix.join(path.posix.dirname(id), spec));
    deps.push(dep); load(dep);
    const named = what.trim().replace(/^\{|\}$/g, '').split(',').map(s => s.trim()).filter(Boolean)
      .map(s => s.replace(/\s+as\s+/, ': '));
    return `const { ${named.join(', ')} } = __mod[${JSON.stringify(dep)}];`;
  });
  const exports = [];
  src = src.replace(/^export\s+(async\s+function|function|class|const|let)\s+([A-Za-z0-9_$]+)/gm, (m, kw, name) => { exports.push(name); return `${kw} ${name}`; });
  modules.set(id, { code: src, deps, exports });
}
load('js/main.js');
const order = []; const seen = new Set();
const visit = id => { if (seen.has(id)) return; seen.add(id); modules.get(id).deps.forEach(visit); order.push(id); };
visit('js/main.js');
let js = [...externalImports].join('\n') + '\nconst __mod = {};\n';
for (const id of order) {
  const m = modules.get(id);
  js += `\n// ===== ${id} =====\n__mod[${JSON.stringify(id)}] = (() => {\n${m.code}\nreturn { ${m.exports.join(', ')} };\n})();\n`;
}

// ---------- Assets ----------
const assets = {};
for (const dir of ['assets/illustrations', 'assets/brand']) {
  for (const f of fs.readdirSync(path.join(ROOT, dir))) {
    const p = `${dir}/${f}`; if (mime[path.extname(f)] && !f.endsWith('.json')) assets[p] = dataURI(p);
  }
}
const json = {
  'assets/brand/number55.json': JSON.parse(read('assets/brand/number55.json')),
  'assets/audio/narration/manifest.json': JSON.parse(read('assets/audio/narration/manifest.json'))
};

// ---------- CSS ----------
let css = read('css/app.css').toString().replace(/url\("\.\.\/(assets\/fonts\/[^"]+)"\)/g, (m, p) => `url("${dataURI(p)}")`);

// ---------- HTML ----------
let html = read('index.html').toString();
html = html.replace('<link rel="stylesheet" href="css/app.css">', `<style>\n${css}\n</style>`);
html = html.replace(/src="(assets\/brand\/[^"]+)"/g, (m, p) => `src="${assets[p]}"`);
html = html.replace(/<img([^>]*?) data-asset="([^"]+)"/g, (m, a, p) => `<img${a} src="${assets[p]}"`);
const boot = `<script>window.__INLINE_ASSETS__ = ${JSON.stringify(assets)};\nwindow.__INLINE_JSON__ = ${JSON.stringify(json)};\nwindow.__PREVIEW__ = ${ARTIFACT};</script>`;
html = html.replace('<script type="module" src="js/main.js"></script>', `${boot}\n<script type="module">\n${js}\n</script>`);

if (ARTIFACT) {
  const title = html.match(/<title>[\s\S]*?<\/title>/)[0];
  const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>'))
    .replace(/<meta charset[^>]*>\s*/, '').replace(/<meta name="viewport"[^>]*>\s*/, '').replace(title, '');
  const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));
  html = `${title}\n${head}\n${body}`;
}
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
const out = path.join(ROOT, 'dist', ARTIFACT ? 'preview-artifact.html' : 'preview.html');
fs.writeFileSync(out, html);
console.log(`wrote ${path.relative(ROOT, out)} (${(html.length / 1024 / 1024).toFixed(2)} MB, ${order.length} modules)`);
