// Brand year number "55" in 3D, flag-colour confetti (Confetti, p.33), and hotspot pins.
import * as THREE from 'three';
import { PALETTE } from '../config.js';
import { mat } from './materials.js';

/** Extrude the official "55" numeral (traced from the Year Number page, p.17) to lie flat on the square. */
export function makeNumber55(data, width = 9, depth = 0.32) {
  const W = data.aspect; // normalised x range 0..aspect, y 0..1
  const shapes = data.shapes.filter(s => !s.hole).map(s => {
    const sh = new THREE.Shape(s.pts.map(([x, y]) => new THREE.Vector2(x, y)));
    return sh;
  });
  const geo = new THREE.ExtrudeGeometry(shapes, { depth: depth / (width / W), bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 1, curveSegments: 4 });
  geo.center();
  const s = width / W;
  geo.scale(s, s, s);
  const m = new THREE.Mesh(geo, [mat(PALETTE.ivory, { rough: 0.7 }), mat(PALETTE.orange, { rough: 0.8 })]);
  m.rotation.x = -Math.PI / 2; // lies on the ground, reading toward the viewer (south)
  m.castShadow = true; m.receiveShadow = true; m.name = 'number-55';
  const g = new THREE.Group(); g.add(m); g.name = 'year-55';
  return g;
}

/** Confetti in flag colours, instanced for mobile performance. */
export function makeConfetti(count = 260, spread = 12) {
  const geo = new THREE.PlaneGeometry(0.16, 0.08);
  const m = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.6 });
  const mesh = new THREE.InstancedMesh(geo, m, count); mesh.name = 'confetti';
  mesh.frustumCulled = false; mesh.visible = false;
  const cols = [PALETTE.flagRed, PALETTE.flagGreen, PALETTE.flagBlack, PALETTE.flagWhite, PALETTE.flagGreen, PALETTE.flagRed];
  const parts = []; const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    c.setHex(cols[i % cols.length]); mesh.setColorAt(i, c);
    parts.push({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3() });
  }
  const dummy = new THREE.Object3D();
  let alive = false, t0 = 0;
  const api = {
    mesh,
    burst(center = new THREE.Vector3(), now = 0) {
      alive = true; t0 = now; mesh.visible = true;
      parts.forEach(pt => {
        pt.p.set(center.x + (Math.random() - 0.5) * spread, center.y + 6 + Math.random() * 6, center.z + (Math.random() - 0.5) * spread * 0.8);
        pt.v.set((Math.random() - 0.5) * 0.8, -0.6 - Math.random() * 0.8, (Math.random() - 0.5) * 0.8);
        pt.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
        pt.w.set(Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 4 - 2);
      });
    },
    stop() { alive = false; mesh.visible = false; },
    update(t, dt) {
      if (!alive) return;
      parts.forEach((pt, i) => {
        pt.p.addScaledVector(pt.v, dt);
        pt.p.x += Math.sin(t * 2 + i) * dt * 0.4;
        if (pt.p.y < 0.05) { pt.p.y = 0.05; pt.v.set(0, 0, 0); pt.w.set(0, 0, 0); }
        pt.r.x += pt.w.x * dt; pt.r.y += pt.w.y * dt; pt.r.z += pt.w.z * dt;
        dummy.position.copy(pt.p); dummy.rotation.copy(pt.r); dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (t - t0 > 30) api.stop();
    }
  };
  return api;
}

/** Hotspot pin: teal disc with a white ring and an Arabic label, always facing the viewer. */
export function makeHotspot(label, fontFamily = 'SansAr') {
  const c = document.createElement('canvas'); c.width = 256; c.height = 320;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 256, 320);
  g.fillStyle = 'rgba(17,24,32,0.25)'; g.beginPath(); g.arc(128, 104, 74, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#038C85'; g.beginPath(); g.arc(128, 100, 66, 0, Math.PI * 2); g.fill();
  g.lineWidth = 10; g.strokeStyle = '#F1ECD6'; g.stroke();
  g.fillStyle = '#F1ECD6'; g.beginPath(); g.arc(128, 100, 18, 0, Math.PI * 2); g.fill();
  g.font = `600 40px ${fontFamily}, "Noto Sans Arabic", Tahoma, sans-serif`;
  g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const w = Math.min(240, g.measureText(label).width + 36);
  g.fillStyle = '#111820'; g.fillRect(128 - w / 2, 210, w, 64);
  g.fillStyle = '#F1ECD6'; g.fillText(label, 128, 244);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.0), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
  m.renderOrder = 10; m.name = 'hotspot-' + label;
  const holder = new THREE.Group(); holder.add(m); holder.userData.pin = m;
  return holder;
}
