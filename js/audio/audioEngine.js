// Procedural sound design with the Web Audio API — no downloaded files needed.
// Ambiences: outdoor (wind, sea, birds), courtyard, majlis (room tone + oud-like plucks), finale (festive).
// SFX: door creak, oyster open, pearl shimmer, weaving rustle, TV on/static, celebration.
// Recorded audio can replace any of these later (see docs/AUDIO.md).

export class AudioEngine {
  constructor() { this.ctx = null; this.enabled = true; this.current = null; this.nodes = []; this.timers = []; }

  /** Must be called from a user gesture (browser autoplay policy). */
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = this.enabled ? 0.9 : 0; this.master.connect(this.ctx.destination);
    this.amb = this.ctx.createGain(); this.amb.gain.value = 0.55; this.amb.connect(this.master);
    this.music = this.ctx.createGain(); this.music.gain.value = 0.35; this.music.connect(this.master);
    this.sfx = this.ctx.createGain(); this.sfx.gain.value = 0.8; this.sfx.connect(this.master);
    this.noiseBuf = this._noise(2);
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.master) this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.1);
  }

  /** Lower ambience/music while the narrator speaks. */
  duck(on) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.amb.gain.setTargetAtTime(on ? 0.25 : 0.55, t, 0.3);
    this.music.gain.setTargetAtTime(on ? 0.12 : 0.35, t, 0.3);
  }

  _noise(sec) {
    const b = this.ctx.createBuffer(1, this.ctx.sampleRate * sec, this.ctx.sampleRate);
    const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  _noiseSource(dest, type = 'lowpass', freq = 500, q = 0.7, gain = 0.3) {
    const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(dest); src.start();
    this.nodes.push(src, f, g);
    return { src, f, g };
  }

  _lfo(param, rate, depth, base) {
    const o = this.ctx.createOscillator(); o.frequency.value = rate;
    const g = this.ctx.createGain(); g.gain.value = depth;
    o.connect(g); g.connect(param); param.value = base; o.start();
    this.nodes.push(o, g);
  }

  _every(min, max, fn) {
    const loop = () => { fn(); this.timers.push(setTimeout(loop, (min + Math.random() * (max - min)) * 1000)); };
    this.timers.push(setTimeout(loop, min * 500));
  }

  stopAmbience() {
    this.timers.forEach(clearTimeout); this.timers = [];
    const t = this.ctx ? this.ctx.currentTime : 0;
    for (const n of this.nodes) {
      try { if (n.gain) n.gain.setTargetAtTime(0, t, 0.4); } catch { /* noop */ }
    }
    const old = this.nodes; this.nodes = [];
    setTimeout(() => old.forEach(n => { try { n.stop && n.stop(); n.disconnect(); } catch { /* noop */ } }), 1600);
  }

  ambience(kind) {
    if (!this.ctx || kind === this.current) return;
    this.stopAmbience(); this.current = kind;
    if (kind === 'outdoor') {
      const w = this._noiseSource(this.amb, 'lowpass', 420, 0.6, 0.22); this._lfo(w.f.frequency, 0.08, 160, 420);
      const sea = this._noiseSource(this.amb, 'bandpass', 700, 0.4, 0.0); this._lfo(sea.g.gain, 0.12, 0.09, 0.1);
      this._every(2.5, 6, () => this.bird());
    } else if (kind === 'courtyard') {
      const w = this._noiseSource(this.amb, 'lowpass', 300, 0.6, 0.13); this._lfo(w.f.frequency, 0.06, 90, 300);
      this._every(4, 9, () => this.bird(0.5));
      this._every(5, 9, () => this.phrase(0.5));
    } else if (kind === 'majlis') {
      this._noiseSource(this.amb, 'lowpass', 180, 0.5, 0.08);
      this._every(2.2, 4.5, () => this.phrase(0.8));
    } else if (kind === 'finale') {
      this._noiseSource(this.amb, 'lowpass', 300, 0.5, 0.06);
      this._every(0.45, 0.46, () => this.drum());
      this._every(1.8, 2.6, () => this.phrase(1));
    }
  }

  // ----- voices -----
  bird(vol = 1) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime; const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
      const s = t + i * 0.13; const f = 2600 + Math.random() * 1400;
      o.frequency.setValueAtTime(f, s); o.frequency.exponentialRampToValueAtTime(f * 1.35, s + 0.07);
      g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(0.035 * vol, s + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.1);
      o.connect(g); g.connect(this.amb); o.start(s); o.stop(s + 0.12);
    }
  }

  /** Karplus-Strong pluck — an oud-like tone. */
  pluck(freq, when = 0, vol = 0.3, dest = this.music) {
    if (!this.ctx) return;
    const sr = this.ctx.sampleRate, len = Math.floor(sr * 1.6);
    const buf = this.ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0);
    const N = Math.max(2, Math.floor(sr / freq)); const ring = new Float32Array(N);
    for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
    for (let i = 0, p = 0; i < len; i++) { const nx = (p + 1) % N; const v = 0.5 * (ring[p] + ring[nx]) * 0.994; d[i] = ring[p]; ring[p] = v; p = nx; }
    const s = this.ctx.createBufferSource(); s.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2400;
    const g = this.ctx.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(dest); s.start(this.ctx.currentTime + when);
  }

  /** A short phrase in maqam Hijaz on D (D Eb F# G A Bb C D). */
  phrase(vol = 1) {
    const scale = [146.83, 155.56, 185.0, 196.0, 220.0, 233.08, 261.63, 293.66];
    let idx = 2 + Math.floor(Math.random() * 4);
    const notes = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < notes; i++) {
      idx = Math.max(0, Math.min(7, idx + (Math.random() < 0.5 ? -1 : 1)));
      this.pluck(scale[idx], i * 0.32, 0.22 * vol);
    }
  }

  drum() { // frame drum (daf): low thump + slap
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.18);
    g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g); g.connect(this.music); o.start(t); o.stop(t + 0.3);
    if (Math.random() < 0.5) this._burst(this.music, 'highpass', 1800, 0.08, 0.06, 0.22);
  }

  _burst(dest, type, freq, dur, vol, delay = 0) {
    const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  sfx_(name) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'tap': { const o = this.ctx.createOscillator(); const g = this.ctx.createGain(); o.frequency.value = 880; g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12); o.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + 0.15); break; }
      case 'door': {
        const o = this.ctx.createOscillator(); o.type = 'sawtooth';
        const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 8;
        const g = this.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.1); g.gain.linearRampToValueAtTime(0, t + 1.1);
        o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(110, t + 0.5); o.frequency.linearRampToValueAtTime(80, t + 1.1);
        o.connect(f); f.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + 1.2);
        this._burst(this.sfx, 'lowpass', 300, 0.3, 0.3, 1.0); break;
      }
      case 'oyster': this._burst(this.sfx, 'bandpass', 2500, 0.08, 0.2); this.pluck(587.33, 0.1, 0.18, this.sfx); break;
      case 'shimmer': [1174.66, 1396.91, 1760, 2349.32].forEach((f, i) => this.pluck(f, i * 0.09, 0.12, this.sfx)); break;
      case 'rustle': for (let i = 0; i < 4; i++) this._burst(this.sfx, 'highpass', 3000, 0.12, 0.06, i * 0.1); break;
      case 'tv-on': {
        const o = this.ctx.createOscillator(); const g = this.ctx.createGain(); o.frequency.value = 15625 / 2;
        g.gain.setValueAtTime(0.02, t); g.gain.linearRampToValueAtTime(0, t + 1.2); o.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + 1.3);
        this._burst(this.sfx, 'bandpass', 3000, 0.7, 0.12); break;
      }
      case 'celebrate': this.phrase(1.2); for (let i = 0; i < 6; i++) setTimeout(() => this.drum(), i * 230); break;
    }
  }
}
