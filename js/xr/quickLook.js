// iOS fallback: export the current diorama to USDZ in the browser and open it in AR Quick Look.
// This is real spatial AR on iPhone/iPad, but static: no hotspots, narration or scene changes.
import * as THREE from 'three';
import { PALETTE, AR_BASE_SCALE } from '../config.js';

export function canQuickLook() {
  const a = document.createElement('a');
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return isIOS && a.relList && a.relList.supports && a.relList.supports('ar');
}

export async function openQuickLook({ worldRoot, focusXf, userXf, anchor, scene, link, hide = [] }) {
  const { USDZExporter } = await import('three/addons/exporters/USDZExporter.js');
  const saved = {
    fp: focusXf.position.clone(), fs: focusXf.scale.clone(), us: userXf.scale.clone(), ur: userXf.rotation.clone(),
    ap: anchor.position.clone(), ar: anchor.rotation.clone()
  };
  const hidden = hide.filter(o => o.visible); hidden.forEach(o => { o.visible = false; });
  // USDZ ignores vertex colours: swap those materials for flat palette colours during export
  const swaps = [];
  worldRoot.traverse(o => { if (o.isMesh && o.material && o.material.vertexColors) { swaps.push([o, o.material]); o.material = new THREE.MeshStandardMaterial({ color: PALETTE.teal, roughness: 0.4 }); } });
  try {
    focusXf.position.set(0, 0, 0); focusXf.scale.setScalar(AR_BASE_SCALE);
    userXf.scale.setScalar(1); userXf.rotation.set(0, 0, 0); anchor.position.set(0, 0, 0); anchor.rotation.set(0, 0, 0);
    scene.updateMatrixWorld(true);
    const exporter = new USDZExporter();
    const opts = { quickLookCompatible: true, maxTextureSize: 1024, ar: { anchoring: { type: 'plane' }, planeAnchoring: { alignment: 'horizontal' } } };
    let data;
    if (typeof exporter.parseAsync === 'function') data = await exporter.parseAsync(worldRoot, opts);
    else data = await new Promise((res, rej) => {
      const r = exporter.parse(worldRoot, res, rej, opts);
      if (r && typeof r.then === 'function') r.then(res, rej); else if (r) res(r);
    });
    const url = URL.createObjectURL(new Blob([data], { type: 'model/vnd.usdz+zip' }));
    link.setAttribute('href', url);
    link.setAttribute('download', 'uae55-family-story.usdz');
    link.click();
    return true;
  } finally {
    focusXf.position.copy(saved.fp); focusXf.scale.copy(saved.fs); userXf.scale.copy(saved.us); userXf.rotation.copy(saved.ur);
    anchor.position.copy(saved.ap); anchor.rotation.copy(saved.ar);
    hidden.forEach(o => { o.visible = true; });
    swaps.forEach(([o, m]) => { o.material.dispose(); o.material = m; });
    scene.updateMatrixWorld(true);
  }
}
