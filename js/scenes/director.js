// Scene director: the seven chapters, their state, and every interaction.
import * as THREE from 'three';
import { SCENES, INFO, HOTSPOTS } from '../config.js';
import { tween, Ease } from '../utils/tween.js';
import { setMode } from '../world/characters.js';

const SEATED_KEYS = ['grandma', 'mother', 'daughter', 'son', 'littleGirl', 'littleBoy'];

export class Director {
  constructor(app) {
    this.app = app; this.index = -1; this.homeOpen = false; this.oysterOpen = false; this.token = 0;
    this.homeTweens = []; this.finaleTweens = []; this.highlightTarget = null; this.basketHold = 0;
  }
  get refs() { return this.app.house.refs; }

  goTo(i, { instant = false } = {}) {
    i = Math.max(0, Math.min(SCENES.length - 1, i));
    const prev = this.index; const s = SCENES[i];
    this.index = i; const token = ++this.token;
    const { ui, audio } = this.app;
    ui.hideSheet(); ui.hideFinale(); ui.toggleMenu(false); ui.setScene(i);

    if (prev === 6 && i !== 6) this.resetFinale();
    if (prev === 5 && i !== 5) this.stopTV();
    if (i === 2 || prev === 2) this.closeOyster(true);
    this.refs.weaving.userData.setStage(-1); this.highlightTarget = null;

    this.setHotspots(s.hotspots);
    audio.ambience(s.ambience);
    this.setHome(s.home === 'open', instant || prev === -1);
    this.setAreeshLifted(this.app.isAR && i === 3);
    this.app.focus(s, instant || prev === -1);
    this.applyModes(i);
    this.app.narrate(s.id, s.narration);
    if (i === 6) this.playFinale(token);
  }
  next() { if (this.index === SCENES.length - 1) { this.app.ui.showFinale(); return; } this.goTo(this.index + 1); }
  prev() { this.goTo(this.index - 1); }

  // ----------------------------------------------------------------------------------
  setHotspots(keys) {
    for (const [k, h] of Object.entries(this.app.hotspots)) h.visible = keys.includes(k);
  }

  setHome(open, instant) {
    if (this.homeOpen === open && !instant) return;
    this.homeOpen = open;
    this.homeTweens.forEach(t => t.cancel()); this.homeTweens = [];
    const { doors, front, roof } = this.refs;
    const d = instant ? 0.0001 : 1;
    if (open && !instant) this.app.audio.sfx_('door');
    doors.forEach(h => {
      const from = h.rotation.y, to = open ? h.userData.dir * 1.65 : 0;
      this.homeTweens.push(tween({ duration: 0.95 * d, delay: open ? 0 : 0.9 * d, ease: Ease.inOut, onUpdate: k => { h.rotation.y = from + (to - from) * k; } }));
    });
    const fs = front.scale.y, ft = open ? 0.06 : 1;
    this.homeTweens.push(tween({ duration: 1.1 * d, delay: open ? 0.8 * d : 0, ease: Ease.inOut, onUpdate: k => { front.scale.y = fs + (ft - fs) * k; } }));
    roof.visible = true;
    const ry = roof.position.y, rs = roof.scale.x, ryT = open ? 4.5 : 0, rsT = open ? 0.001 : 1;
    this.homeTweens.push(tween({
      duration: 1.1 * d, delay: open ? 0.9 * d : 0, ease: Ease.inOut,
      onUpdate: k => { roof.position.y = ry + (ryT - ry) * k; roof.scale.setScalar(rs + (rsT - rs) * k); },
      onComplete: () => { roof.visible = !open; }
    }));
  }

  /** AR only: in AR the visitor looks down from above, so the palm-frond shade over the weaving corner is
   *  lifted away in scene 4 (as the majlis roof is), then put back. The 3D mode camera looks under it instead. */
  setAreeshLifted(lift) {
    const roof = this.refs.areeshRoof; if (!roof || !!this._areeshLifted === lift) return;
    this._areeshLifted = lift;
    if (this.areeshTween) this.areeshTween.cancel();
    const y0 = roof.position.y, s0 = roof.scale.x, y1 = lift ? 4 : 0, s1 = lift ? 0.001 : 1;
    roof.visible = true;
    this.areeshTween = tween({ duration: 1.0, ease: Ease.inOut,
      onUpdate: k => { roof.position.y = y0 + (y1 - y0) * k; roof.scale.setScalar(s0 + (s1 - s0) * k); },
      onComplete: () => { roof.visible = !lift; } });
  }

  applyModes(i) {
    const p = this.refs.people;
    for (const [k, person] of Object.entries(p)) {
      const h = person.userData.home; if (!h) continue;
      setMode(person, h.mode, { lookYaw: 0 });
    }
    setMode(p.father, i === 2 ? 'dive' : 'idle');
    if (i === 5) { // everyone in the majlis turns toward the television
      const tvPos = this.refs.tv.position;
      for (const k of ['grandma', 'son', 'littleGirl', 'littleBoy']) {
        const person = p[k];
        let yaw = Math.atan2(tvPos.x - person.position.x, tvPos.z - person.position.z) - person.rotation.y;
        yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
        setMode(person, 'tv', { lookYaw: THREE.MathUtils.clamp(yaw, -1.2, 1.2) });
      }
    }
  }

  // ----------------------------------------------------------------------------------
  handleTap(key) {
    const { ui, audio } = this.app; const i = this.index;
    audio.sfx_('tap');
    if (key.startsWith('hs:')) {
      const id = key.slice(3); const h = HOTSPOTS[id];
      if (h.action === 'enter') return this.goTo(1);
      if (h.goto !== undefined) return this.goTo(h.goto);
      if (h.info) return ui.showSheet(INFO[h.info]);
      return;
    }
    switch (key) {
      case 'door': if (i === 0) this.goTo(1); break;
      case 'father': if (i !== 2) this.goTo(2); break;
      case 'oyster': if (i !== 2) this.goTo(2); else if (!this.oysterOpen) this.openOyster(); break;
      case 'pearl':
        if (i !== 2) { this.goTo(2); break; }
        if (!this.oysterOpen) { this.openOyster(); break; }
        audio.sfx_('shimmer'); ui.showSheet(INFO.pearl);
        this.app.narrate('pearl-info', INFO.pearl.text.join(' '));
        break;
      case 'basket':
        if (i !== 3) { this.goTo(3); break; }
        ui.showSheet(INFO.basket, {
          onStep: k => { this.refs.weaving.userData.setStage(k); this.highlightTarget = this.refs.weaving.userData.highlight(k); audio.sfx_('rustle'); },
          onClose: () => { this.refs.weaving.userData.setStage(-1); this.highlightTarget = null; }
        });
        break;
      case 'grandma':
        if (i !== 4) { this.goTo(4); break; }
        ui.setCaption(INFO.grandma.story, 'المجلس: ملتقى الأجيال');
        this.app.narrate('grandma-story', INFO.grandma.story);
        this.refs.people.littleGirl.userData.rig.laugh = true;
        ui.showSheet({ ...INFO.grandma, text: INFO.grandma.text });
        break;
      case 'tv': if (i !== 5) this.goTo(5); else this.playTV(); break;
    }
  }

  // ---------- Scene 3: oyster & pearl ----------
  openOyster() {
    const { hinge, pearl, sparkles } = this.refs.oyster.userData;
    this.oysterOpen = true; this.app.audio.sfx_('oyster');
    tween({ duration: 0.9, ease: Ease.back, onUpdate: k => { hinge.rotation.x = -1.15 * k; } });
    tween({ duration: 1.3, delay: 0.5, ease: Ease.out, onUpdate: k => { pearl.position.y = 0.06 + 0.4 * k; }, onComplete: () => { sparkles.visible = true; this.app.audio.sfx_('shimmer'); } });
    setMode(this.refs.people.father, 'present');
    this.app.ui.setHint('المس اللؤلؤة لتعرف قصتها');
  }
  closeOyster(instant) {
    const { hinge, pearl, sparkles } = this.refs.oyster.userData;
    this.oysterOpen = false; hinge.rotation.x = 0; pearl.position.y = 0.06; sparkles.visible = false;
  }

  // ---------- Scene 6: television ----------
  async playTV() {
    const tvp = this.app.tvProgram; if (tvp.playing) return;
    const { screenMat } = this.refs.tv.userData;
    this.app.audio.sfx_('tv-on'); this.app.narrator.stop();
    this.app.ui.setHint('رسوم متحركة أصلية — ليست لقطات أرشيفية');
    const tex = await tvp.start(() => this.tvEnded());
    screenMat.emissiveMap = tex; screenMat.color.setHex(0x000000); screenMat.needsUpdate = true;
    tween({ duration: 0.6, onUpdate: k => { screenMat.emissiveIntensity = k; } });
  }
  tvEnded() {
    const { screenMat } = this.refs.tv.userData;
    screenMat.emissiveIntensity = 0; screenMat.color.setHex(0x2F3B36);
    if (this.index === 5) { this.app.ui.showSheet(INFO.tvInfo); this.app.ui.setHint('المس التلفاز لمشاهدة الحكاية مرة أخرى'); }
  }
  stopTV() { if (this.app.tvProgram.playing) this.app.tvProgram.stop(false); this.tvEnded(); }

  // ---------- Scene 7: the family gathers ----------
  playFinale(token) {
    const { people, standing, gather, flagpole } = this.refs; const app = this.app;
    this.finaleTweens.forEach(t => t.cancel()); this.finaleTweens = [];
    const walkers = { father: people.father };
    for (const k of SEATED_KEYS) {
      const seated = people[k], st = standing[k];
      seated.visible = false; st.visible = true;
      st.position.set(seated.position.x, 0, seated.position.z); st.rotation.y = seated.rotation.y;
      walkers[k] = st;
    }
    Object.entries(walkers).forEach(([k, w], idx) => {
      const [tx, tz] = gather[k]; const sx = w.position.x, sz = w.position.z;
      const ry0 = Math.atan2(tx - sx, tz - sz);
      setMode(w, 'walk'); w.rotation.y = ry0;
      w.userData.rig.ring.visible = false;
      this.finaleTweens.push(tween({
        duration: 2.6 + idx * 0.12, delay: 0.3, ease: Ease.inOut,
        onUpdate: (k2, raw) => {
          w.position.x = sx + (tx - sx) * k2; w.position.z = sz + (tz - sz) * k2;
          if (raw > 0.85) w.rotation.y = ry0 + (0 - ry0) * ((raw - 0.85) / 0.15);
        },
        onComplete: () => {
          if (token !== this.token) return;
          w.rotation.y = 0; setMode(w, 'cheer');
          const ring = w.userData.rig.ring; ring.visible = true; ring.scale.setScalar(0.01);
          tween({ duration: 0.6, ease: Ease.back, onUpdate: k3 => ring.scale.setScalar(Math.max(0.01, k3)) });
        }
      }));
    });
    // flag rises to the top of the pole
    const flag = flagpole.userData.flag; const fb = flagpole.userData.bottom, ft = flagpole.userData.top;
    flag.position.y = fb;
    this.finaleTweens.push(tween({ duration: 4.5, delay: 0.6, ease: Ease.inOut, onUpdate: k => { flag.position.y = fb + (ft - fb) * k; } }));
    // the official 55 rises on the square
    const y55 = app.year55; y55.visible = true; y55.position.y = -0.4;
    this.finaleTweens.push(tween({ duration: 1.8, delay: 2.2, ease: Ease.back, onUpdate: k => { y55.position.y = -0.4 + 0.58 * k; } }));
    this.finaleTweens.push(tween({
      duration: 0.01, delay: 3.0, onComplete: () => {
        if (token !== this.token) return;
        app.confetti.burst(new THREE.Vector3(-2.5, 0, 5), app.elapsed); app.audio.sfx_('celebrate');
      }
    }));
    this.finaleTweens.push(tween({ duration: 0.01, delay: 8.5, onComplete: () => { if (token === this.token) app.ui.showFinale(); } }));
  }

  resetFinale() {
    this.finaleTweens.forEach(t => t.cancel()); this.finaleTweens = [];
    const { people, standing, flagpole } = this.refs;
    for (const k of SEATED_KEYS) { standing[k].visible = false; people[k].visible = true; standing[k].userData.rig.ring.visible = false; }
    const f = people.father; const h = f.userData.home;
    f.position.set(h.x, 0, h.z); f.rotation.y = h.ry; f.userData.rig.ring.visible = false;
    flagpole.userData.flag.position.y = flagpole.userData.top;
    this.app.year55.visible = false; this.app.year55.position.y = -0.4;
    this.app.confetti.stop();
  }

  // ----------------------------------------------------------------------------------
  update(dt, t) {
    const r = this.refs;
    if (this.oysterOpen) {
      const { pearl, sparkles } = r.oyster.userData;
      pearl.rotation.y += dt * 1.2; pearl.position.y += Math.sin(t * 2) * 0.0008;
      sparkles.children.forEach((s, i) => {
        const a = s.userData.a + t * 1.4;
        s.position.set(Math.cos(a) * 0.17, pearl.position.y + Math.sin(a * 2 + i) * 0.05, Math.sin(a) * 0.17 + 0.02);
        s.rotation.y = t * 3;
      });
    }
    const w = r.weaving.userData;
    if (w.state.live) { // continuous weaving: the basket grows ring by ring, then starts over
      if (w.state.progress >= 1) { this.basketHold += dt; if (this.basketHold > 3) { this.basketHold = 0; w.setProgress(0.12); } }
      else w.setProgress(w.state.progress + dt * 0.035);
      if (this.index === 3 && Math.random() < dt * 0.25) this.app.audio.sfx_('rustle');
    }
    if (this.highlightTarget) { const k = 1 + Math.sin(t * 5) * 0.06; this.highlightTarget.scale.setScalar(k); }
    [w.fronds, w.dyes, w.strip, w.basket].forEach(o => { if (o !== this.highlightTarget) o.scale.setScalar(1); });
    const L = r.lantern.userData; L.glass.material.emissiveIntensity = 1.1 + Math.sin(t * 11) * 0.08 + Math.sin(t * 3.7) * 0.06;
    this.app.tvProgram.update(dt);
  }
}
