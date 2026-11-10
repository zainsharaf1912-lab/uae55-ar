// Asset URL resolver. The single-file preview build injects window.__INLINE_ASSETS__ (path -> data URI);
// the deployable build serves the same relative paths from /assets.
export function asset(path) {
  const map = (typeof window !== 'undefined' && window.__INLINE_ASSETS__) || null;
  return (map && map[path]) || path;
}

export async function loadJSON(path) {
  const inline = (typeof window !== 'undefined' && window.__INLINE_JSON__) || null;
  if (inline && inline[path]) return inline[path];
  const res = await fetch(asset(path));
  if (!res.ok) throw new Error(`تعذّر تحميل ${path} (${res.status})`);
  return res.json();
}

/** Resolve every <img data-asset="..."> in the document. */
export function hydrateImages(root = document) {
  root.querySelectorAll('img[data-asset]').forEach(img => { img.src = asset(img.dataset.asset); });
  root.querySelectorAll('img[src^="assets/"]').forEach(img => { img.src = asset(img.getAttribute('src')); });
}
