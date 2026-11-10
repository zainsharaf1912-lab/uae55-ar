// Shared materials, canvas textures and mesh helpers.
// Everything uses MeshStandardMaterial so the same world exports to USDZ (iOS AR Quick Look).
import * as THREE from 'three';
import { PALETTE } from '../config.js';

const matCache = new Map();
let grainTex = null;

function makeCanvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

/** Brand "grain texture" (p.30) — subtle noise multiplied into flat colours. */
export function grainTexture() {
  if (grainTex) return grainTex;
  const [c, g] = makeCanvas(128, 128);
  const img = g.createImageData(128, 128);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 226 + Math.floor(rnd() * 29);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainTex = new THREE.CanvasTexture(c);
  grainTex.wrapS = grainTex.wrapT = THREE.RepeatWrapping;
  grainTex.colorSpace = THREE.SRGBColorSpace;
  return grainTex;
}

export function mat(color, opts = {}) {
  const { rough = 0.92, metal = 0, grain = false, emissive = 0x000000, emissiveIntensity = 1,
    side = THREE.FrontSide, transparent = false, opacity = 1, map = null, flat = true } = opts;
  const key = map ? null : [color, rough, metal, grain, emissive, emissiveIntensity, side, transparent, opacity, flat].join('|');
  if (key && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({
    color, roughness: rough, metalness: metal, flatShading: flat, side, transparent, opacity,
    emissive, emissiveIntensity, map: map || (grain ? grainTexture() : null)
  });
  if (key) matCache.set(key, m);
  return m;
}

export function shadowed(mesh, cast = true, receive = true) {
  mesh.castShadow = cast; mesh.receiveShadow = receive; return mesh;
}

export function box(w, h, d, color, opts) {
  return shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), color && color.isMaterial ? color : mat(color, opts)));
}

/** Box positioned by its min corner on the ground: x0..x1, z0..z1, from y0 to y0+h */
export function boxSpan(x0, x1, z0, z1, h, color, y0 = 0, opts) {
  const m = box(Math.abs(x1 - x0), h, Math.abs(z1 - z0), color, opts);
  m.position.set((x0 + x1) / 2, y0 + h / 2, (z0 + z1) / 2);
  return m;
}

export function cyl(rt, rb, h, color, seg = 10, opts) {
  return shadowed(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), color && color.isMaterial ? color : mat(color, opts)));
}

export function sphere(r, color, ws = 12, hs = 8, opts) {
  return shadowed(new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), color && color.isMaterial ? color : mat(color, opts)));
}

// ---------- Canvas pattern textures (drawn in the official palette) ----------
const hex = n => '#' + n.toString(16).padStart(6, '0');

function texFrom(c, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

/** Woven palm-frond mat (hasir) — natural stripes with dyed bands */
export function matTexture() {
  const [c, g] = makeCanvas(256, 256);
  const cols = [PALETTE.frondDry, PALETTE.mustard, PALETTE.frondDry, PALETTE.rust, PALETTE.frondDry, PALETTE.olive, PALETTE.frondDry, PALETTE.lavender];
  for (let i = 0; i < 16; i++) { g.fillStyle = hex(cols[i % cols.length]); g.fillRect(0, i * 16, 256, 16); }
  g.globalAlpha = 0.18; g.fillStyle = '#000';
  for (let y = 0; y < 256; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < 256; x += 8) g.fillRect(x, y, 4, 2);
  return texFrom(c);
}

/** Majlis floor carpet — sand ground with a geometric border (brand majlis illustration is pale) */
export function carpetTexture() {
  const [c, g] = makeCanvas(512, 512);
  g.fillStyle = hex(PALETTE.linen); g.fillRect(0, 0, 512, 512);
  g.fillStyle = hex(PALETTE.rust); g.fillRect(16, 16, 480, 480);
  g.fillStyle = hex(PALETTE.linen); g.fillRect(40, 40, 432, 432);
  g.fillStyle = hex(PALETTE.coral); g.fillRect(56, 56, 400, 400);
  g.fillStyle = hex(PALETTE.mustard);
  for (let i = 0; i < 12; i++) { // diamond border
    const x = 28 + i * 40;
    for (const [px, py] of [[x, 28], [x, 484], [28, x], [484, x]]) {
      g.beginPath(); g.moveTo(px, py - 9); g.lineTo(px + 9, py); g.lineTo(px, py + 9); g.lineTo(px - 9, py); g.fill();
    }
  }
  g.strokeStyle = hex(PALETTE.ivory); g.lineWidth = 6;
  for (let r = 40; r < 180; r += 34) { g.beginPath(); g.moveTo(256, 256 - r); g.lineTo(256 + r, 256); g.lineTo(256, 256 + r); g.lineTo(256 - r, 256); g.closePath(); g.stroke(); }
  return texFrom(c);
}

/** Majlis cushion fabric — white with blue motifs, as in the official majlis illustration */
export function cushionTexture() {
  const [c, g] = makeCanvas(256, 128);
  g.fillStyle = hex(PALETTE.ivory); g.fillRect(0, 0, 256, 128);
  g.fillStyle = hex(PALETTE.petrol);
  g.fillRect(0, 0, 256, 10); g.fillRect(0, 118, 256, 10);
  for (let x = 32; x < 256; x += 64) {
    g.save(); g.translate(x, 64);
    g.strokeStyle = hex(PALETTE.petrol); g.lineWidth = 4; g.strokeRect(-22, -22, 44, 44);
    g.fillStyle = hex(PALETTE.sky); g.rotate(Math.PI / 4); g.fillRect(-11, -11, 22, 22);
    g.restore();
  }
  return texFrom(c);
}

/** UAE flag texture: red vertical band at the hoist, then green / white / black horizontal stripes */
let _flagTex = null;
export function flagTexture() {
  if (_flagTex) return _flagTex;
  const [c, g] = makeCanvas(256, 128);
  g.fillStyle = hex(PALETTE.flagGreen); g.fillRect(64, 0, 192, 43);
  g.fillStyle = hex(PALETTE.flagWhite); g.fillRect(64, 43, 192, 42);
  g.fillStyle = hex(PALETTE.flagBlack); g.fillRect(64, 85, 192, 43);
  g.fillStyle = hex(PALETTE.flagRed); g.fillRect(0, 0, 64, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (_flagTex = t);
}

/** Studded teak door */
let _doorTex = null;
export function doorTexture() {
  if (_doorTex) return _doorTex;
  const [c, g] = makeCanvas(128, 256);
  g.fillStyle = hex(PALETTE.clay); g.fillRect(0, 0, 128, 256);
  g.fillStyle = hex(PALETTE.woodDark);
  for (let x = 0; x < 128; x += 21) g.fillRect(x, 0, 2, 256);
  g.strokeStyle = hex(PALETTE.woodDark); g.lineWidth = 5; g.strokeRect(10, 14, 108, 100); g.strokeRect(10, 132, 108, 108);
  g.fillStyle = hex(PALETTE.brass);
  for (let y = 24; y < 250; y += 22) for (let x = 20; x < 120; x += 22) { g.beginPath(); g.arc(x, y, 2.6, 0, Math.PI * 2); g.fill(); }
  return (_doorTex = texFrom(c));
}
