// Mobile optimisation: merge static meshes that share a material into single draw calls.
// Subtrees flagged userData.dynamic (animated parts, interactive props, characters) are left untouched.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const KEEP = new Set(['position', 'normal', 'uv']);

export function mergeStatic(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map();
  const walk = o => {
    if (o !== root && (o.userData.dynamic || !o.visible)) return;
    if (o.isMesh && !o.isInstancedMesh && !o.userData.tap && o.material && !Array.isArray(o.material) &&
        o.material.isMeshStandardMaterial && !o.material.vertexColors && o.material.visible !== false) {
      const key = `${o.material.uuid}|${o.castShadow}|${o.receiveShadow}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(o);
    }
    for (const c of o.children) walk(c);
  };
  walk(root);
  let before = 0, after = 0;
  for (const meshes of buckets.values()) {
    before += meshes.length;
    if (meshes.length < 2) { after += meshes.length; continue; }
    try {
      const geos = meshes.map(m => {
        const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
        for (const name of Object.keys(g.attributes)) if (!KEEP.has(name)) g.deleteAttribute(name);
        if (!g.attributes.normal) g.computeVertexNormals();
        if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
        g.morphAttributes = {}; g.clearGroups();
        g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
        return g;
      });
      const merged = mergeGeometries(geos, false);
      if (!merged) { after += meshes.length; continue; }
      const mesh = new THREE.Mesh(merged, meshes[0].material);
      mesh.castShadow = meshes[0].castShadow; mesh.receiveShadow = meshes[0].receiveShadow;
      mesh.name = 'merged'; root.add(mesh);
      meshes.forEach(m => m.parent && m.parent.remove(m));
      geos.forEach(g => g.dispose());
      after += 1;
    } catch (e) {
      after += meshes.length; console.warn('[merge] skipped a bucket', e);
    }
  }
  return { before, after };
}
