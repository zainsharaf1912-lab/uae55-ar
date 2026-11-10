// Arabic RTL interface controller (DOM). The same DOM is the WebXR dom-overlay in AR mode.
import { SCENES, FAMILY_COLORS } from '../config.js';
import { asset } from '../utils/assets.js';

const $ = id => document.getElementById(id);
const hex = n => '#' + n.toString(16).padStart(6, '0');

export class UI {
  constructor() {
    this.handlers = {};
    this.screens = ['splash', 'loading', 'hud', 'finale', 'fatal'].reduce((o, k) => (o[k] = $(k), o), {});
    // scene dots + menu
    const dots = $('scene-dots'); const list = $('scene-list');
    SCENES.forEach((s, i) => {
      dots.appendChild(document.createElement('i'));
      const li = document.createElement('li'); const b = document.createElement('button');
      b.innerHTML = `<span class="n" style="background:${hex(FAMILY_COLORS[i])};color:#111820">${s.n}</span><span class="t"></span>`;
      b.querySelector('.t').textContent = s.title;
      b.addEventListener('click', () => { this.toggleMenu(false); this.emit('goto', i); });
      li.appendChild(b); list.appendChild(li);
    });
    $('btn-menu').addEventListener('click', () => this.toggleMenu());
    $('btn-next').addEventListener('click', () => this.emit('next'));
    $('btn-prev').addEventListener('click', () => this.emit('prev'));
    $('btn-replay').addEventListener('click', () => this.emit('replay'));
    $('btn-exit').addEventListener('click', () => this.emit('exit'));
    $('sheet-close').addEventListener('click', () => this.hideSheet());
    $('btn-sound').addEventListener('click', e => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); this.emit('sound', on); });
    $('btn-voice').addEventListener('click', e => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); this.emit('voice', on); });
    $('btn-restart').addEventListener('click', () => { this.hideFinale(); this.emit('goto', 0); });
    $('btn-finale-close').addEventListener('click', () => this.hideFinale());
    $('btn-share').addEventListener('click', () => this.showQR());
    for (const [id, ev] of [['ar-rot-l', 'ar-rot-l'], ['ar-rot-r', 'ar-rot-r'], ['ar-bigger', 'ar-bigger'], ['ar-smaller', 'ar-smaller'], ['ar-replace', 'ar-replace']]) {
      $(id).addEventListener('click', () => this.emit(ev));
    }
    $('btn-start-ar').addEventListener('click', () => this.emit('start-ar'));
    $('btn-start-3d').addEventListener('click', () => this.emit('start-3d'));
    document.addEventListener('keydown', e => {
      if (!this.screens.hud.classList.contains('is-active')) return;
      if (e.key === 'Escape') { this.hideSheet(); this.toggleMenu(false); }
      if (e.key === 'ArrowLeft') this.emit('next');
      if (e.key === 'ArrowRight') this.emit('prev');
    });
  }

  on(ev, fn) { (this.handlers[ev] ||= []).push(fn); }
  emit(ev, ...a) { (this.handlers[ev] || []).forEach(fn => fn(...a)); }

  show(name) {
    for (const [k, el] of Object.entries(this.screens)) {
      if (k === 'finale') continue;
      el.classList.toggle('is-active', k === name);
    }
  }

  setDevice(state, text) {
    const card = $('device-card'); card.classList.remove('ok', 'warn'); if (state) card.classList.add(state);
    $('device-status').textContent = text;
  }

  showStartButtons({ ar, iosLink }) {
    $('btn-start-ar').hidden = !ar;
    const ios = $('btn-ios-ar'); ios.hidden = !iosLink; $('ios-ar-note').hidden = !iosLink;
    if (iosLink) ios.href = iosLink;
    $('btn-start-3d').classList.toggle('btn-primary', !ar && !iosLink);
    $('btn-start-3d').classList.toggle('btn-secondary', !!(ar || iosLink));
  }

  progress(k, text) { $('loading-bar').style.width = Math.round(k * 100) + '%'; if (text) $('loading-text').textContent = text; }

  setMode(ar) {
    document.body.classList.toggle('xr-active', ar); if (!ar) document.body.classList.remove('ar-scanning');
    $('mode-badge').textContent = ar ? 'واقع معزز · AR' : 'وضع ثلاثي الأبعاد · ليس واقعاً معززاً';
    $('ar-controls').hidden = true; $('ar-guide').hidden = !ar;
  }

  arStatus(state) {
    const guide = $('ar-guide'), ctrls = $('ar-controls'), txt = $('ar-guide-text');
    document.body.classList.toggle('ar-scanning', state === 'scanning' || state === 'found');
    if (state === 'scanning') { guide.hidden = false; ctrls.hidden = true; txt.textContent = 'حرّك هاتفك ببطء فوق طاولة أو أرضية لاكتشاف سطح مستوٍ'; }
    if (state === 'found') { txt.textContent = 'وجدنا سطحاً! المس الشاشة لوضع الفريج هنا'; }
    if (state === 'placed') { guide.hidden = true; ctrls.hidden = false; }
  }

  setScene(i) {
    const s = SCENES[i];
    $('chapter-label').textContent = `المشهد ${s.n} من ${SCENES.length}`;
    $('scene-title').textContent = s.title; $('scene-en').textContent = s.en;
    $('scene-dots').querySelectorAll('i').forEach((d, k) => d.classList.toggle('on', k === i));
    $('scene-list').querySelectorAll('button').forEach((b, k) => { if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    $('btn-prev').disabled = i === 0;
    $('btn-next').innerHTML = i === SCENES.length - 1 ? 'الختام <span aria-hidden="true">←</span>' : 'التالي <span aria-hidden="true">←</span>';
    this.setCaption(s.narration, s.hint);
  }

  setCaption(text, hint = '') { $('caption-text').textContent = text; $('caption-hint').textContent = hint; $('caption-text').scrollTop = 0; }
  setHint(hint) { $('caption-hint').textContent = hint || ''; }
  speaking(on) { $('btn-replay').classList.toggle('speaking', !!on); }

  toggleMenu(force) {
    const m = $('scene-menu'); const open = force ?? m.hidden;
    m.hidden = !open; $('btn-menu').setAttribute('aria-expanded', open);
  }

  showSheet(info, { onStep, onClose } = {}) {
    this._onClose = onClose || null;
    $('sheet-kicker').textContent = info.kicker || '';
    $('sheet-title').textContent = info.title || '';
    const img = $('sheet-img'); if (info.img) { img.src = asset(info.img); img.alt = info.title || ''; img.parentElement.hidden = false; } else img.parentElement.hidden = true;
    const body = $('sheet-text'); body.innerHTML = '';
    (info.text || []).forEach(t => { const p = document.createElement('p'); p.textContent = t; body.appendChild(p); });
    if (info.note) { const n = document.createElement('p'); n.className = 'label-note'; n.textContent = info.note; body.appendChild(n); }
    const steps = $('sheet-steps'); steps.innerHTML = ''; steps.hidden = !info.steps;
    if (info.steps) {
      const tabs = document.createElement('div'); tabs.className = 'steps-tabs'; tabs.setAttribute('role', 'tablist');
      const panel = document.createElement('div'); panel.className = 'step-panel'; panel.setAttribute('role', 'tabpanel');
      const select = k => {
        tabs.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-selected', j === k));
        panel.innerHTML = ''; const h = document.createElement('h4'); h.textContent = `${k + 1}. ${info.steps[k].title}`;
        const p = document.createElement('p'); p.textContent = info.steps[k].text; panel.append(h, p);
        onStep && onStep(k);
      };
      info.steps.forEach((s, k) => { const b = document.createElement('button'); b.setAttribute('role', 'tab'); b.textContent = `${k + 1} · ${s.tab}`; b.addEventListener('click', () => select(k)); tabs.appendChild(b); });
      steps.append(tabs, panel); select(0);
    }
    $('sheet').classList.toggle('compact', !!info.steps);
    $('sheet').hidden = false;
  }

  hideSheet() {
    if ($('sheet').hidden) return;
    $('sheet').hidden = true;
    const cb = this._onClose; this._onClose = null; cb && cb();
  }

  toast(msg, ms = 3800) {
    const t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(this._tt); this._tt = setTimeout(() => { t.hidden = true; }, ms);
  }

  showFinale() { this.screens.finale.classList.add('is-active'); $('qr-box').hidden = true; }
  hideFinale() { this.screens.finale.classList.remove('is-active'); }

  async showQR() {
    const box = $('qr-box'); const url = location.href.split('#')[0];
    $('qr-url').textContent = url; box.hidden = false;
    try {
      if (!window.qrcode) await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
        s.onload = res; s.onerror = rej; document.head.appendChild(s);
      });
      const qr = window.qrcode(0, 'M'); qr.addData(url); qr.make();
      const n = qr.getModuleCount(); const c = $('qr-canvas'); const g = c.getContext('2d');
      const cell = Math.floor(c.width / (n + 8)); const off = Math.floor((c.width - cell * n) / 2);
      g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#111820';
      for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) g.fillRect(off + k * cell, off + r * cell, cell, cell);
    } catch {
      this.toast('تعذّر إنشاء رمز QR دون اتصال بالإنترنت. انسخ الرابط الظاهر أدناه.');
    }
  }

  fatal(msg) { $('fatal-text').textContent = msg; this.show('fatal'); }
}
