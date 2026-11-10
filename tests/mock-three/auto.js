// Headless test double for three.js: every property/call returns a chainable stand-in, while
// scene-graph bookkeeping (add/remove/traverse/parent/visible/userData) behaves like the real thing.
// Purpose: run the app's own logic (UI flow, director, interactions) without WebGL.
export function auto(name, store = {}) {
  const target = function () {};
  const proxy = new Proxy(target, {
    get(t, k) {
      if (k in store) return store[k];
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === Symbol.iterator) return function* () {};
      if (typeof k === 'symbol') return undefined;
      switch (k) {
        case 'then': return undefined;
        case 'toJSON': return () => name;
        case 'toString': return () => name;
        case 'children': return (store.children = []);
        case 'userData': return (store.userData = {});
        case 'parent': return null;
        case 'visible': return true;
        case 'count': return 0;
        case 'add': return (...objs) => { (store.children ||= []); objs.forEach(o => { if (o && o.parent && o.parent !== proxy && o.parent.remove) o.parent.remove(o); store.children.push(o); try { o.parent = proxy; } catch {} }); return proxy; };
        case 'remove': return (...objs) => { store.children = (store.children || []).filter(c => !objs.includes(c)); objs.forEach(o => { try { o.parent = null; } catch {} }); return proxy; };
        case 'traverse': return fn => { fn(proxy); [...(store.children || [])].forEach(c => c && c.traverse && c.traverse(fn)); };
        case 'traverseVisible': return fn => { if (store.visible === false) return; fn(proxy); [...(store.children || [])].forEach(c => c && c.traverseVisible && c.traverseVisible(fn)); };
      }
      const child = auto(name + '.' + k); store[k] = child; return child;
    },
    set(t, k, v) { store[k] = v; return true; },
    apply() { return auto(name + '()'); },
    construct() { return auto('new ' + name); },
    has() { return true; }
  });
  return proxy;
}
