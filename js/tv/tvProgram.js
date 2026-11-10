// Original animated historical sequence for the vintage TV (Scene 6).
// Drawn on a canvas in a warm 1970s broadcast look; clearly labelled as original animation.
// If a licensed archival clip is supplied at assets/video/tv-archive.mp4 it is used instead.
import * as THREE from 'three';
import { TV_PROGRAM, FAMILY_COLORS, ARCHIVE_VIDEO } from '../config.js';

const W = 512, H = 384;
const hex = n => '#' + n.toString(16).padStart(6, '0');
const EMIRATE_COLORS = FAMILY_COLORS.map(hex);

export function createTVProgram(fontFamily = 'Naskh') {
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const g = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  let playing = false, t = 0, video = null, videoTex = null, onEnd = null, lastDraw = -1;
  const total = TV_PROGRAM.reduce((a, s) => a + s.dur, 0);

  function text(str, x, y, size, color = '#F1ECD6', weight = 700, font = fontFamily) {
    g.font = `${weight} ${size}px ${font}, "Noto Naskh Arabic", "Noto Sans Arabic", serif`;
    g.fillStyle = color; g.textAlign = 'center'; g.direction = 'rtl'; g.textBaseline = 'middle';
    g.fillText(str, x, y);
  }

  function drawStatic(k) {
    const img = g.createImageData(W, H);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255 * k; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
  }

  function frameFX() {
    // scanlines + vignette + label
    g.fillStyle = 'rgba(0,0,0,0.16)';
    for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
    const v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.78);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(17,24,32,0.7)'; g.fillRect(0, H - 30, W, 30);
    text('رسوم متحركة أصلية — ليست لقطات أرشيفية', W / 2, H - 15, 15, '#D1E8CC', 400, 'SansAr');
  }

  function scene(s, k, lt) {
    switch (s.kind) {
      case 'sea': {
        g.fillStyle = '#E8C7B4'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#F6D178'; g.beginPath(); g.arc(380, 110, 46, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#31677F'; g.fillRect(0, 210, W, H);
        g.fillStyle = '#038C85'; for (let i = 0; i < 6; i++) g.fillRect(((i * 97 + lt * 40) % (W + 60)) - 60, 230 + i * 18, 60, 4);
        for (let b = 0; b < 2; b++) { // dhow silhouettes
          const x = 90 + b * 190 + Math.sin(lt + b) * 6, y = 205 - b * 10;
          g.fillStyle = '#5E3A24'; g.beginPath(); g.moveTo(x - 50, y); g.lineTo(x + 55, y); g.lineTo(x + 38, y + 18); g.lineTo(x - 36, y + 18); g.fill();
          g.fillStyle = '#F1ECD6'; g.beginPath(); g.moveTo(x, y - 4); g.lineTo(x + 42, y - 8); g.lineTo(x - 10, y - 78); g.fill();
        }
        break;
      }
      case 'union': {
        g.fillStyle = '#F1ECD6'; g.fillRect(0, 0, W, H);
        const cx = W / 2, cy = 160, conv = Math.min(1, lt / 2.2);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 2; const R = 120 * (1 - conv) + 52;
          g.fillStyle = EMIRATE_COLORS[i]; g.beginPath(); g.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 22, 0, Math.PI * 2); g.fill();
        }
        g.fillStyle = EMIRATE_COLORS[6]; g.globalAlpha = 0.35; g.beginPath(); g.arc(cx + 205, cy - 60, 22, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
        break;
      }
      case 'rak': {
        g.fillStyle = '#F1ECD6'; g.fillRect(0, 0, W, H);
        const cx = W / 2, cy = 160, k2 = Math.min(1, lt / 1.8);
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2 - Math.PI / 2; const R = 52;
          let x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
          if (i === 6) { x = (cx + 205) + (x - cx - 205) * k2; y = (cy - 60) + (y - cy + 60) * k2; }
          g.fillStyle = EMIRATE_COLORS[i]; g.beginPath(); g.arc(x, y, 22, 0, Math.PI * 2); g.fill();
        }
        if (k2 >= 1) { g.strokeStyle = '#111820'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, 86, 0, Math.PI * 2); g.stroke(); }
        break;
      }
      case 'build': {
        g.fillStyle = '#7CAFDE'; g.fillRect(0, 0, W, H);
        const heights = [80, 140, 110, 190, 230, 150, 120, 175, 95];
        heights.forEach((h, i) => {
          const grow = Math.min(1, Math.max(0, lt * 0.7 - i * 0.08));
          const hh = h * grow;
          g.fillStyle = ['#E5DECB', '#F1ECD6', '#D5D7E3', '#C1DEEE'][i % 4];
          g.fillRect(30 + i * 52, 280 - hh, 42, hh);
          g.fillStyle = 'rgba(49,103,127,.5)'; for (let y = 280 - hh + 10; y < 270; y += 16) g.fillRect(38 + i * 52, y, 26, 6);
        });
        g.fillStyle = '#E8C7B4'; g.fillRect(0, 280, W, H);
        break;
      }
      case 'mars': {
        g.fillStyle = '#111820'; g.fillRect(0, 0, W, H);
        for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(241,236,214,' + (0.3 + (i % 5) / 8) + ')'; g.fillRect((i * 83) % W, (i * 47) % 300, 2, 2); }
        g.fillStyle = '#C86757'; g.beginPath(); g.arc(150, 170, 80, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#AB4B23'; g.beginPath(); g.arc(130, 150, 18, 0, Math.PI * 2); g.fill();
        const a = lt * 0.9; const px = 150 + Math.cos(a) * 140, py = 170 + Math.sin(a) * 55;
        g.fillStyle = '#E4BE59'; g.fillRect(px - 9, py - 7, 18, 14);
        g.fillStyle = '#7CAFDE'; g.fillRect(px - 26, py - 3, 15, 6); g.fillRect(px + 11, py - 3, 15, 6);
        break;
      }
      case 'family': {
        g.fillStyle = '#C86757'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#D1E8CC'; g.fillRect(40, 40, W - 80, 230);
        const heights = [62, 86, 80, 70, 56, 46, 44];
        heights.forEach((h, i) => {
          const x = 120 + i * 45, y = 240;
          const pop = Math.min(1, Math.max(0, lt * 2 - i * 0.2));
          g.fillStyle = i === 0 || i === 2 ? '#111820' : (i === 1 || i === 4 || i === 6 ? '#F4F1E8' : EMIRATE_COLORS[i]);
          g.fillRect(x - 12, y - h * pop, 24, h * pop);
          g.fillStyle = '#9C6A4C'; g.beginPath(); g.arc(x, y - h * pop - 9, 9 * pop, 0, Math.PI * 2); g.fill();
          g.fillStyle = EMIRATE_COLORS[i]; g.fillRect(x - 14, y + 6, 28, 6);
        });
        break;
      }
    }
    // Title band
    const fade = Math.min(1, k * 6, (1 - k) * 8);
    g.globalAlpha = Math.max(0, fade);
    g.fillStyle = 'rgba(17,24,32,0.78)'; g.fillRect(0, 286, W, 68);
    text(s.title, W / 2, 306, 26, '#F6D178');
    text(s.sub, W / 2, 336, 19, '#F1ECD6', 400);
    g.globalAlpha = 1;
  }

  function draw() {
    if (video) return; // VideoTexture updates itself
    if (t < 0.6) { drawStatic(1 - t / 0.9); frameFX(); texture.needsUpdate = true; return; }
    let acc = 0.6;
    for (const s of TV_PROGRAM) {
      if (t < acc + s.dur) { scene(s, (t - acc) / s.dur, t - acc); frameFX(); texture.needsUpdate = true; return; }
      acc += s.dur;
    }
  }

  async function tryArchive() {
    // Licensed archival footage slot (see docs/ASSET_PLAN.md). Silent fallback to the original animation.
    if (!ARCHIVE_VIDEO) return null;
    try {
      const url = ARCHIVE_VIDEO;
      const v = document.createElement('video'); v.src = url; v.playsInline = true; v.muted = false; v.crossOrigin = 'anonymous';
      await v.play();
      return v;
    } catch { return null; }
  }

  return {
    texture, canvas,
    get playing() { return playing; },
    async start(done) {
      onEnd = done; t = 0; playing = true; lastDraw = -1;
      video = await tryArchive();
      if (video) { videoTex = new THREE.VideoTexture(video); videoTex.colorSpace = THREE.SRGBColorSpace; video.onended = () => this.stop(true); }
      return video ? videoTex : texture;
    },
    stop(finished = false) {
      playing = false;
      if (video) { video.pause(); video = null; }
      g.fillStyle = '#111'; g.fillRect(0, 0, W, H); texture.needsUpdate = true;
      if (finished && onEnd) onEnd();
    },
    update(dt) {
      if (!playing || video) return;
      t += dt;
      if (t - lastDraw < 1 / 30) return; // ~30 fps is plenty for a CRT
      lastDraw = t; draw();
      if (t > total + 0.6) this.stop(true);
    },
    total: total + 0.6
  };
}
