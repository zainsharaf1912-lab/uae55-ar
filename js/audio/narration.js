// Arabic narration manager.
// Priority: 1) recorded voice file assets/audio/narration/<id>.mp3 (to be produced by the team),
//           2) the device's Arabic text-to-speech voice (temporary, clearly a placeholder),
//           3) captions only. Captions are always shown.

export class Narrator {
  constructor(audio) {
    this.audio = audio; this.enabled = true; this.el = null; this.utter = null; this.onState = () => {};
    this.voice = null; this.synth = window.speechSynthesis || null; this.missingFiles = new Set();
    if (this.synth) {
      const pick = () => {
        const vs = this.synth.getVoices();
        this.voice = vs.find(v => /^ar[-_]AE/i.test(v.lang)) || vs.find(v => /^ar/i.test(v.lang)) || null;
      };
      pick(); if (this.synth.addEventListener) this.synth.addEventListener('voiceschanged', pick);
    }
  }

  /** Reads assets/audio/narration/manifest.json — the list of recorded files that actually exist. */
  async init() {
    try {
      const inline = window.__INLINE_JSON__ && window.__INLINE_JSON__['assets/audio/narration/manifest.json'];
      const m = inline || await (await fetch('assets/audio/narration/manifest.json')).json();
      this.recorded = new Set(m.files || []);
    } catch { this.recorded = new Set(); }
  }

  get hasTTS() { return !!(this.synth && this.voice); }

  setEnabled(on) { this.enabled = on; if (!on) this.stop(); }

  stop() {
    if (this.el) { this.el.pause(); this.el = null; }
    if (this.synth) this.synth.cancel();
    this.audio && this.audio.duck(false);
    this.onState(false);
  }

  async speak(id, text) {
    this.stop();
    if (!this.enabled) return 'off';
    const src = `assets/audio/narration/${id}.mp3`;
    const url = (window.__INLINE_ASSETS__ && window.__INLINE_ASSETS__[src]) || src;
    if (this.recorded && this.recorded.has(id) && !this.missingFiles.has(id)) {
      try {
        const el = new Audio(url); el.preload = 'auto';
        await new Promise((res, rej) => { el.oncanplaythrough = res; el.onerror = rej; el.load(); setTimeout(rej, 2500); });
        this.el = el; this.audio && this.audio.duck(true); this.onState(true);
        el.onended = () => { this.audio && this.audio.duck(false); this.onState(false); };
        await el.play();
        return 'file';
      } catch { this.missingFiles.add(id); this.el = null; }
    }
    if (this.hasTTS) {
      const u = new SpeechSynthesisUtterance(text);
      u.voice = this.voice; u.lang = this.voice.lang; u.rate = 0.92; u.pitch = 1;
      u.onstart = () => { this.audio && this.audio.duck(true); this.onState(true); };
      u.onend = u.onerror = () => { this.audio && this.audio.duck(false); this.onState(false); };
      this.utter = u; this.synth.speak(u);
      return 'tts';
    }
    return 'captions';
  }
}
