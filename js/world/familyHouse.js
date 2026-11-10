// The family home (بيت العائلة): walled courtyard house with majlis, service room + barjeel,
// areesh shade, and all seven family members at their stations.
import * as THREE from 'three';
import { PALETTE, FAMILY_COLORS } from '../config.js';
import { mat, box, boxSpan, cyl, shadowed, doorTexture } from './materials.js';
import { makePerson, setMode } from './characters.js';
import { addParapet, makeBarjeel, makeFlagPole, makePalm } from './environment.js';
import { makeOyster, makeDivingGear, makeWeavingSet, makeWovenMat, makeCarpet, makeCushionRun, makeCoffeeSet, makeLantern, makeTV, makeClayPots } from './props.js';

const WALL = PALETTE.linen;
const WALL_H = 3.2;

function crenellateWall(g, x0, x1, z0, z1, h) {
  const geo = new THREE.ConeGeometry(0.17, 0.32, 4); const m = mat(WALL, { grain: true });
  const alongX = (x1 - x0) > (z1 - z0);
  const len = alongX ? x1 - x0 : z1 - z0;
  for (let s = 0.35; s < len - 0.2; s += 0.75) {
    const c = shadowed(new THREE.Mesh(geo, m));
    c.position.set(alongX ? x0 + s : (x0 + x1) / 2, h + 0.16, alongX ? (z0 + z1) / 2 : z0 + s);
    c.rotation.y = Math.PI / 4; g.add(c);
  }
}

function wall(g, x0, x1, z0, z1, h = WALL_H, color = WALL) {
  g.add(boxSpan(x0, x1, z0, z1, h, color, 0, { grain: true }));
  crenellateWall(g, x0, x1, z0, z1, h);
}

export function buildFamilyHouse(screenTexture) {
  const g = new THREE.Group(); g.name = 'family-house';
  const refs = { people: {}, standing: {}, interactive: [] };

  // Courtyard floor
  const floor = boxSpan(-9.0, 4.0, -7.6, 3.6, 0.03, PALETTE.ivory, 0, { grain: true }); floor.castShadow = false; g.add(floor);

  // Outer walls (north, west, east)
  wall(g, -9.4, 4.4, -8.0, -7.6);
  wall(g, -9.4, -9.0, -7.6, 3.6);
  wall(g, 4.0, 4.4, -7.6, 3.6);

  // ---------- Front wall with the double door (folds down when the visitor enters) ----------
  const front = new THREE.Group(); front.name = 'front-wall'; front.userData.dynamic = true; g.add(front);
  wall(front, -9.4, -3.4, 3.6, 4.0);
  wall(front, -1.6, 4.4, 3.6, 4.0);
  front.add(boxSpan(-3.4, -1.6, 3.6, 4.0, 0.6, WALL, 2.6, { grain: true }));
  crenellateWall(front, -3.4, -1.6, 3.6, 4.0, WALL_H);
  // carved wooden door frame
  front.add(boxSpan(-3.6, -1.4, 3.98, 4.12, 0.2, PALETTE.woodDark, 2.55));
  for (const x of [-3.6, -1.6]) front.add(boxSpan(x, x + 0.2, 3.98, 4.12, 2.6, PALETTE.woodDark, 0));
  const doorMat = mat(0xffffff, { map: doorTexture() });
  const doors = [];
  for (const [hx, dir] of [[-3.4, 1], [-1.6, -1]]) {
    const hinge = new THREE.Group(); hinge.position.set(hx, 0, 3.8); front.add(hinge);
    const leaf = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.55, 0.12), doorMat));
    leaf.position.set(dir * 0.45, 1.3, 0); leaf.userData.tap = 'door'; hinge.add(leaf);
    const ring = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 5, 12), mat(PALETTE.brass, { metal: 0.6, rough: 0.35 })));
    ring.position.set(dir * 0.75, 1.25, 0.08); hinge.add(ring);
    hinge.userData.dir = dir; doors.push(hinge); refs.interactive.push(leaf);
  }
  // decorative niches either side of the door
  for (const x of [-4.4, -0.6]) front.add(boxSpan(x - 0.25, x + 0.25, 4.0, 4.04, 0.9, 0xC9BFA8, 1.4));
  refs.front = front; refs.doors = doors;

  // ---------- Majlis (north-west) — open colonnade, liftable roof ----------
  wall(g, -1.3, -0.9, -7.6, -3.6);
  for (const x of [-8.75, -6.95, -5.15, -3.35]) g.add(boxSpan(x - 0.16, x + 0.16, -3.92, -3.6, 2.85, WALL, 0, { grain: true }));
  const roof = new THREE.Group(); roof.name = 'majlis-roof'; roof.userData.dynamic = true; g.add(roof);
  roof.add(boxSpan(-9.2, -0.7, -3.98, -3.5, 0.4, WALL, 2.85, { grain: true })); // beam
  roof.add(boxSpan(-9.2, -0.7, -7.8, -3.5, 0.24, 0xD9D0BB, 3.2, { grain: true }));
  addParapet(roof, -9.2, -0.7, -7.8, -3.5, 3.44, WALL, 0.2, 0.36);
  for (let x = -8.9; x < -0.9; x += 0.8) { // danchal poles over the colonnade
    const p = cyl(0.045, 0.045, 0.4, PALETTE.woodDark, 6); p.rotation.x = Math.PI / 2; p.position.set(x, 3.08, -3.4); roof.add(p);
  }
  refs.roof = roof;

  const carpet = makeCarpet(7.4, 3.7); carpet.position.set(-5.05, 0, -5.65); g.add(carpet);
  const backRun = makeCushionRun(6.6); backRun.position.set(-5.2, 0.05, -7.15); g.add(backRun);
  const sideRun = makeCushionRun(3.0, Math.PI / 2); sideRun.position.set(-8.55, 0.05, -5.6); g.add(sideRun);
  const coffee = makeCoffeeSet(); coffee.position.set(-5.0, 0.05, -6.25); g.add(coffee);
  const lantern = makeLantern(); lantern.position.set(-6.55, 0.3, -6.45); g.add(lantern);
  refs.lantern = lantern; lantern.userData.dynamic = true;
  const tv = makeTV(screenTexture); tv.position.set(-1.95, 0.05, -6.75); tv.rotation.y = -0.7;
  tv.traverse(o => { if (o.isMesh) o.userData.tap = 'tv'; });
  tv.userData.dynamic = true; g.add(tv); refs.tv = tv; refs.interactive.push(tv);

  // ---------- Service room (east) with barjeel and the flag ----------
  g.add(boxSpan(0.6, 4.0, -7.6, -3.4, WALL_H, WALL, 0, { grain: true }));
  addParapet(g, 0.6, 4.0, -7.6, -3.4, WALL_H, WALL, 0.2, 0.36);
  const sdoor = shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 0.08), doorMat)); sdoor.position.set(2.3, 1.0, -3.36); g.add(sdoor);
  g.add(makeBarjeel(2.0, WALL_H, -5.6, PALETTE.ivory));
  const flagpole = makeFlagPole(3.55, WALL_H, -7.15, 1.15, 3.6); g.add(flagpole);
  refs.flagpole = flagpole;
  const pots = makeClayPots(); pots.position.set(3.2, 0, -2.6); g.add(pots);
  const palm = makePalm(5.6, 9); palm.position.set(-4.6, 0, 2.7); g.add(palm);

  // ---------- Areesh (palm-frond shade) for the weaving corner ----------
  const areesh = new THREE.Group(); areesh.name = 'areesh'; g.add(areesh);
  for (const [x, z] of [[-8.6, -2.2], [-4.9, -2.2], [-8.6, 1.9], [-4.9, 1.9]]) { const p = cyl(0.07, 0.08, 2.65, PALETTE.woodDark, 6); p.position.set(x, 1.32, z); areesh.add(p); }
  for (const z of [-2.2, 1.9]) { const b = cyl(0.05, 0.05, 3.9, PALETTE.woodDark, 5); b.rotation.z = Math.PI / 2; b.position.set(-6.75, 2.66, z); areesh.add(b); }
  const areeshRoof = new THREE.Group(); areeshRoof.name = 'areesh-roof'; areeshRoof.userData.dynamic = true; areesh.add(areeshRoof);
  for (let x = -8.5; x <= -5.0; x += 0.32) { const s = box(0.16, 0.05, 4.3, PALETTE.frondDry); s.position.set(x, 2.74, -0.15); s.castShadow = true; areeshRoof.add(s); }
  refs.areeshRoof = areeshRoof;

  // ---------- Stations ----------
  // Pearl station (father)
  const pearlMat = makeWovenMat(3.0, 2.0); pearlMat.position.set(1.15, 0, 0.75); g.add(pearlMat);
  const gear = makeDivingGear(); gear.position.set(1.15, 0, 0.6); g.add(gear);
  const oyster = makeOyster(); oyster.position.set(1.05, 0.06, 1.25); oyster.traverse(o => { if (o.isMesh) o.userData.tap = 'oyster'; });
  oyster.userData.pearl.userData.tap = 'pearl';
  oyster.userData.dynamic = true; g.add(oyster); refs.oyster = oyster; refs.interactive.push(oyster);

  // Weaving station (mother + daughter)
  const wMat = makeWovenMat(3.4, 2.6); wMat.position.set(-6.7, 0, -0.1); g.add(wMat);
  const weaving = makeWeavingSet(); weaving.position.set(-6.65, 0, 0.0); weaving.userData.dynamic = true; g.add(weaving);
  weaving.userData.basket.traverse(o => { if (o.isMesh) o.userData.tap = 'basket'; });
  refs.weaving = weaving; refs.interactive.push(weaving.userData.basket);

  // ---------- The family: seven members, seven emirate colours ----------
  const C = FAMILY_COLORS;
  const people = refs.people;
  people.grandma = makePerson({ name: 'grandma', kind: 'grandma', height: 1.6, robe: PALETTE.abaya, under: PALETTE.teal, skin: PALETTE.skin2, seated: true, accent: C[0] });
  people.father = makePerson({ name: 'father', kind: 'man', height: 1.78, skin: PALETTE.skin1, beard: 0x5C5248, accent: C[1] });
  people.mother = makePerson({ name: 'mother', kind: 'woman', height: 1.64, robe: PALETTE.abaya, under: PALETTE.blush, skin: PALETTE.skin3, seated: true, accent: C[2] });
  people.daughter = makePerson({ name: 'daughter', kind: 'girl', height: 1.42, robe: PALETTE.mustard, skin: PALETTE.skin3, seated: true, accent: C[3] });
  people.son = makePerson({ name: 'son', kind: 'boy', height: 1.32, skin: PALETTE.skin1, seated: true, accent: C[4] });
  people.littleGirl = makePerson({ name: 'little-girl', kind: 'girl', height: 1.06, robe: PALETTE.lavender, skin: PALETTE.skin1, seated: true, accent: C[5], hair: 0x3A2618 });
  people.littleBoy = makePerson({ name: 'little-boy', kind: 'boy', height: 1.0, robe: PALETTE.ice, cap: PALETTE.ice, skin: PALETTE.skin3, seated: true, accent: C[6] });

  const place = (p, x, z, ry, mode, extra) => { p.userData.dynamic = true; p.position.set(x, 0, z); p.rotation.y = ry; p.userData.home = { x, z, ry, mode }; setMode(p, mode, extra); g.add(p); };
  place(people.grandma, -5.0, -6.95, 0, 'talk');
  place(people.father, 0.95, 0.25, -0.15, 'dive');
  place(people.mother, -7.45, -0.55, 0.82, 'weave');
  place(people.daughter, -5.85, -0.55, -0.82, 'watch');
  place(people.son, -6.15, -5.35, Math.atan2(1.15, -1.6), 'listen', { react: true });
  place(people.littleGirl, -5.0, -5.05, Math.PI, 'listen', { laugh: true });
  place(people.littleBoy, -3.85, -5.35, Math.atan2(-1.15, -1.6), 'listen', { laugh: true });
  people.grandma.userData.rig.baseY = 0.17; // sits on the majlis floor cushion
  people.grandma.traverse(o => { if (o.isMesh) o.userData.tap = 'grandma'; });
  refs.interactive.push(people.grandma);
  people.father.traverse(o => { if (o.isMesh) o.userData.tap = 'father'; });
  refs.interactive.push(people.father);

  // Standing versions of the seated members, used when the whole family gathers (scene 7)
  const st = refs.standing;
  st.grandma = makePerson({ name: 'grandma-standing', kind: 'grandma', height: 1.58, robe: PALETTE.abaya, under: PALETTE.teal, skin: PALETTE.skin2, accent: C[0] });
  st.mother = makePerson({ name: 'mother-standing', kind: 'woman', height: 1.64, robe: PALETTE.abaya, under: PALETTE.blush, skin: PALETTE.skin3, accent: C[2] });
  st.daughter = makePerson({ name: 'daughter-standing', kind: 'girl', height: 1.42, robe: PALETTE.mustard, skin: PALETTE.skin3, accent: C[3] });
  st.son = makePerson({ name: 'son-standing', kind: 'boy', height: 1.32, skin: PALETTE.skin1, accent: C[4] });
  st.littleGirl = makePerson({ name: 'little-girl-standing', kind: 'girl', height: 1.06, robe: PALETTE.lavender, skin: PALETTE.skin1, accent: C[5], hair: 0x3A2618 });
  st.littleBoy = makePerson({ name: 'little-boy-standing', kind: 'boy', height: 1.0, robe: PALETTE.ice, cap: PALETTE.ice, skin: PALETTE.skin3, accent: C[6] });
  for (const k of Object.keys(st)) { st[k].visible = false; st[k].userData.dynamic = true; g.add(st[k]); }

  // Finale formation: an arc in the courtyard facing the open front, in emirate-colour order
  refs.gather = {
    grandma: [-4.9, 1.2], littleGirl: [-4.0, 1.75], son: [-3.15, 2.05], father: [-2.3, 2.15],
    mother: [-1.45, 2.05], daughter: [-0.6, 1.75], littleBoy: [0.25, 1.2]
  };
  return { group: g, refs };
}
