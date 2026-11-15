// render.js — every pixel the game draws: sky, garden, entities, HUD, screens.
// One job: drawing. All glow uses additive compositing ('lighter').
import { W, H, LANTERN, BLOOMS, BLOOM_ORDER, WISPS, WAVES_TOTAL, PALETTE, mulberry32 } from './config.js';

// Ambient scene, seeded once so title and shots are stable.
const rng = mulberry32(20261116);
export const stars = Array.from({ length: 130 }, () => ({
  x: rng() * W, y: rng() * 300, r: 0.5 + rng() * 1.4, tw: rng() * 6.28, sp: 0.5 + rng() * 1.5,
}));
export const fireflies = Array.from({ length: 26 }, () => ({
  x: rng() * W, y: 380 + rng() * 300, ph: rng() * 6.28, sp: 0.2 + rng() * 0.5, r: 1.5 + rng() * 2,
}));
export const tufts = Array.from({ length: 42 }, () => ({
  x: rng() * W, y: 430 + rng() * 270, h: 5 + rng() * 7, lean: (rng() - 0.5) * 0.6,
}));
export const mushrooms = Array.from({ length: 12 }, () => ({
  x: 60 + rng() * (W - 120), y: 430 + rng() * 270, s: 0.6 + rng() * 0.9, hue: rng(),
}));

function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function glowCircle(c, x, y, r, color, alpha) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalAlpha = alpha;
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, r, 0, 6.29); c.fill();
  c.globalAlpha = 1;
}

export function drawBackground(c, t) {
  // Dusk sky.
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(0.45, PALETTE.skyMid);
  sky.addColorStop(0.72, PALETTE.skyLow);
  sky.addColorStop(1, PALETTE.horizon);
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);
  // Stars.
  for (const s of stars) {
    const a = 0.35 + 0.65 * Math.abs(Math.sin(t * s.sp + s.tw));
    c.globalAlpha = a * 0.9;
    c.fillStyle = '#fff8e0';
    c.fillRect(s.x, s.y, s.r, s.r);
  }
  c.globalAlpha = 1;
  // Moon with halo and craters.
  c.save();
  c.globalCompositeOperation = 'lighter';
  glowCircle(c, 1090, 110, 150, PALETTE.moonGlow, 0.8);
  c.restore();
  c.fillStyle = PALETTE.moon;
  c.beginPath(); c.arc(1090, 110, 44, 0, 6.29); c.fill();
  c.fillStyle = 'rgba(190,170,130,0.5)';
  c.beginPath(); c.arc(1078, 100, 8, 0, 6.29); c.fill();
  c.beginPath(); c.arc(1104, 122, 6, 0, 6.29); c.fill();
  c.beginPath(); c.arc(1096, 94, 4, 0, 6.29); c.fill();
  // Parallax hills.
  c.fillStyle = PALETTE.hillFar;
  c.beginPath(); c.moveTo(0, 420);
  for (let x = 0; x <= W; x += 32) c.lineTo(x, 400 - Math.sin(x * 0.004 + 1.2) * 34 - Math.sin(x * 0.011) * 12);
  c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
  c.fillStyle = PALETTE.hillMid;
  c.beginPath(); c.moveTo(0, 470);
  for (let x = 0; x <= W; x += 32) c.lineTo(x, 452 - Math.sin(x * 0.006 + 4.0) * 26 - Math.sin(x * 0.017 + 1) * 9);
  c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
  // Meadow.
  const gnd = c.createRadialGradient(640, 430, 80, 640, 520, 720);
  gnd.addColorStop(0, PALETTE.ground);
  gnd.addColorStop(1, PALETTE.groundEdge);
  c.fillStyle = gnd;
  c.fillRect(0, 430, W, H - 430);
  // Grass tufts swaying — sparse and dark so they read as meadow, not rain.
  c.strokeStyle = '#256b42';
  c.lineWidth = 1.6;
  for (const tu of tufts) {
    const sway = Math.sin(t * 1.2 + tu.x * 0.02) * 1.5 + tu.lean * 3;
    c.beginPath();
    c.moveTo(tu.x, tu.y);
    c.quadraticCurveTo(tu.x + sway, tu.y - tu.h * 0.6, tu.x + sway * 1.4, tu.y - tu.h);
    c.stroke();
  }
  // Glowing mushrooms.
  for (const m of mushrooms) {
    const hue = m.hue > 0.5 ? '#8fe8ff' : '#ffb347';
    c.save();
    c.globalCompositeOperation = 'lighter';
    glowCircle(c, m.x, m.y - 6 * m.s, 14 * m.s, hue, 0.25 + 0.15 * Math.sin(t * 2 + m.x));
    c.restore();
    c.fillStyle = '#e8dcc8';
    c.fillRect(m.x - 1.5 * m.s, m.y - 6 * m.s, 3 * m.s, 6 * m.s);
    c.fillStyle = hue;
    c.beginPath(); c.arc(m.x, m.y - 6 * m.s, 5 * m.s, Math.PI, 0); c.fill();
  }
  // Fireflies.
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const f of fireflies) {
    const x = f.x + Math.sin(t * f.sp + f.ph) * 30;
    const y = f.y + Math.cos(t * f.sp * 0.8 + f.ph) * 14;
    const a = 0.25 + 0.55 * Math.abs(Math.sin(t * 1.4 + f.ph * 3));
    glowCircle(c, x, y, 9, '#ffe9a8', a);
    c.fillStyle = '#fff3c0';
    c.beginPath(); c.arc(x, y, f.r, 0, 6.29); c.fill();
  }
  c.restore();
}

function drawPlot(c, plot, t, hover) {
  // Soil mound.
  c.fillStyle = PALETTE.soil;
  c.beginPath(); c.ellipse(plot.x, plot.y, 32, 15, 0, 0, 6.29); c.fill();
  c.strokeStyle = hover ? PALETTE.gold : PALETTE.soilRim;
  c.lineWidth = hover ? 2.5 : 1.5;
  c.beginPath(); c.ellipse(plot.x, plot.y, 32, 15, 0, 0, 6.29); c.stroke();
  if (!plot.bloom) {
    c.globalAlpha = 0.5 + 0.3 * Math.sin(t * 2 + plot.x);
    c.strokeStyle = '#8a7a5a';
    c.setLineDash([4, 5]);
    c.beginPath(); c.ellipse(plot.x, plot.y, 20, 9, 0, 0, 6.29); c.stroke();
    c.setLineDash([]);
    c.globalAlpha = 1;
  }
}

function drawBloom(c, plot, t) {
  const b = plot.bloom;
  const def = b.def;
  const bx = plot.x, by = plot.y;
  const sway = Math.sin(b.sway) * 3;
  const topX = bx + sway, topY = by - 30;
  // Glow halo.
  c.save();
  c.globalCompositeOperation = 'lighter';
  const pulse = 0.5 + 0.25 * Math.sin(t * 3 + plot.x);
  glowCircle(c, topX, topY, def.size * 2.1, def.center, 0.35 * pulse);
  if (b.flash > 0) glowCircle(c, topX, topY, def.size * 2.6, '#ffffff', 0.7);
  c.restore();
  // Stem + leaves.
  c.strokeStyle = '#3f9e58';
  c.lineWidth = 4;
  c.beginPath(); c.moveTo(bx, by - 2);
  c.quadraticCurveTo(bx + sway * 0.5, by - 16, topX, topY + 6);
  c.stroke();
  c.fillStyle = '#2f7a4e';
  c.beginPath(); c.ellipse(bx - 8, by - 12, 9, 4, -0.5, 0, 6.29); c.fill();
  c.beginPath(); c.ellipse(bx + 8, by - 9, 9, 4, 0.5, 0, 6.29); c.fill();
  // Petals.
  for (let i = 0; i < def.petals; i++) {
    const a = (i / def.petals) * Math.PI * 2 + Math.sin(t * 0.8 + plot.x) * 0.08;
    const px = topX + Math.cos(a) * def.size * 0.62;
    const py = topY + Math.sin(a) * def.size * 0.62;
    const grad = c.createLinearGradient(topX, topY, px, py);
    grad.addColorStop(0, def.edge);
    grad.addColorStop(1, def.petal);
    c.fillStyle = grad;
    c.beginPath();
    c.ellipse(px, py, def.size * 0.42, def.size * 0.26, a, 0, 6.29);
    c.fill();
  }
  // Center.
  const cg = c.createRadialGradient(topX, topY, 0, topX, topY, def.size * 0.42);
  cg.addColorStop(0, '#ffffff');
  cg.addColorStop(0.55, def.center);
  cg.addColorStop(1, def.petal);
  c.fillStyle = cg;
  c.beginPath(); c.arc(topX, topY, def.size * 0.4, 0, 6.29); c.fill();
  c.fillStyle = 'rgba(90,50,0,0.55)';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * 6.28 + 0.4;
    c.beginPath(); c.arc(topX + Math.cos(a) * 3.4, topY + Math.sin(a) * 3.4, 1.1, 0, 6.29); c.fill();
  }
}

function drawLantern(c, g, t) {
  const x = LANTERN.x, y = LANTERN.y;
  const hpFrac = Math.max(0, g.lanternHp / LANTERN.hp);
  const flick = 1 + Math.sin(t * 9) * 0.05 + Math.sin(t * 23) * 0.03;
  // Big warm glow, scaled by remaining HP.
  c.save();
  c.globalCompositeOperation = 'lighter';
  glowCircle(c, x, y - 46, 190 * (0.55 + 0.45 * hpFrac) * flick, 'rgba(255,190,90,0.55)', 0.55);
  c.restore();
  // Post.
  c.fillStyle = '#4a2c17';
  c.fillRect(x - 5, y - 8, 10, 26);
  c.fillStyle = '#2c1a0d';
  c.beginPath(); c.ellipse(x, y + 20, 22, 7, 0, 0, 6.29); c.fill();
  // Lantern body.
  c.fillStyle = '#1d1420';
  rr(c, x - 26, y - 78, 52, 56, 10); c.fill();
  c.strokeStyle = '#c9a25e'; c.lineWidth = 2.5;
  rr(c, x - 26, y - 78, 52, 56, 10); c.stroke();
  c.fillStyle = '#c9a25e';
  c.fillRect(x - 8, y - 88, 16, 10);
  c.beginPath(); c.arc(x, y - 88, 9, Math.PI, 0); c.fill();
  // Flame (height follows HP).
  const fh = 12 + 22 * hpFrac;
  const fg = c.createLinearGradient(0, y - 26, 0, y - 26 - fh);
  fg.addColorStop(0, '#ff9a3c');
  fg.addColorStop(0.6, '#ffd23e');
  fg.addColorStop(1, '#fffbe6');
  c.fillStyle = fg;
  c.beginPath();
  c.moveTo(x, y - 26 - fh * flick);
  c.bezierCurveTo(x + 9, y - 40, x + 7, y - 30, x, y - 24);
  c.bezierCurveTo(x - 7, y - 30, x - 9, y - 40, x, y - 26 - fh * flick);
  c.fill();
  // HP ring under the lantern.
  c.strokeStyle = 'rgba(255,255,255,0.25)';
  c.lineWidth = 5;
  c.beginPath(); c.arc(x, y + 26, 30, 0, 6.29); c.stroke();
  c.strokeStyle = hpFrac > 0.5 ? '#ffd23e' : hpFrac > 0.25 ? '#ff9a3c' : '#ff5d5d';
  c.beginPath(); c.arc(x, y + 26, 30, -Math.PI / 2, -Math.PI / 2 + hpFrac * 6.28); c.stroke();
}

function drawWisp(c, w, t) {
  const def = WISPS[w.kind];
  const bob = Math.sin(w.wob * 1.4) * 3;
  const x = w.x, y = w.y + bob;
  const R = w.radius * 1.25; // drawn slightly larger than the hit radius
  // Purple halo so the enemy reads against the dark garden.
  c.save();
  c.globalCompositeOperation = 'lighter';
  glowCircle(c, x, y, R * 2.1, def.eye, 0.30);
  c.restore();
  // Smoky body.
  const body = c.createRadialGradient(x, y, 2, x, y, R * 1.5);
  body.addColorStop(0, w.hitT > 0 ? '#a894d8' : def.body);
  body.addColorStop(0.7, 'rgba(30,18,58,0.9)');
  body.addColorStop(1, 'rgba(20,12,40,0)');
  c.fillStyle = body;
  c.beginPath();
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const r = R * (1 + 0.16 * Math.sin(a * 3 + w.wob));
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.9;
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath(); c.fill();
  // Bright rim so the silhouette separates from the background.
  c.strokeStyle = def.eye;
  c.globalAlpha = 0.55;
  c.lineWidth = 1.6;
  c.beginPath(); c.arc(x, y, R * 0.92, 0, 6.29); c.stroke();
  c.globalAlpha = 1;
  // Spikes for brutes.
  if (w.kind === 'brute') {
    c.fillStyle = '#2c1230';
    for (let i = 0; i < 5; i++) {
      const a = -0.6 + i * 0.3;
      c.beginPath();
      c.moveTo(x + Math.cos(a) * R * 0.7, y - R * 0.7);
      c.lineTo(x + Math.cos(a) * R * 1.35, y - R * 1.25);
      c.lineTo(x + Math.cos(a + 0.18) * R * 0.7, y - R * 0.55);
      c.closePath(); c.fill();
    }
  }
  // Glowing eyes.
  c.save();
  c.globalCompositeOperation = 'lighter';
  glowCircle(c, x - 6, y - 3, 8, def.eye, 0.85);
  glowCircle(c, x + 6, y - 3, 8, def.eye, 0.85);
  c.restore();
  c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(x - 6, y - 3, 3.1, 0, 6.29); c.fill();
  c.beginPath(); c.arc(x + 6, y - 3, 3.1, 0, 6.29); c.fill();
  // HP bar when hurt.
  if (w.hp < w.maxHp) {
    const f = Math.max(0, w.hp / w.maxHp);
    c.fillStyle = 'rgba(0,0,0,0.55)';
    c.fillRect(x - 16, y - R - 12, 32, 5);
    c.fillStyle = f > 0.5 ? '#8fe8a8' : f > 0.25 ? '#ffd23e' : '#ff5d5d';
    c.fillRect(x - 15, y - R - 11, 30 * f, 3);
  }
  // Slow tint.
  if (w.slowT > 0) {
    c.strokeStyle = 'rgba(143,232,255,0.8)';
    c.lineWidth = 2;
    c.beginPath(); c.arc(x, y, R + 3, 0, 6.29); c.stroke();
  }
}

function drawBolts(c, g) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const b of g.bolts) {
    c.strokeStyle = b.color;
    c.lineWidth = 4.5;
    c.globalAlpha = 0.95;
    c.beginPath(); c.moveTo(b.x, b.y);
    for (const p of b.trail) c.lineTo(p.x, p.y);
    c.stroke();
    glowCircle(c, b.x, b.y, 15, b.color, 0.95);
    c.fillStyle = '#ffffff';
    c.beginPath(); c.arc(b.x, b.y, 3.6, 0, 6.29); c.fill();
  }
  c.restore();
  c.globalAlpha = 1;
}

function drawParticles(c, g) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const p of g.parts) {
    const a = Math.max(0, p.life / p.maxLife);
    c.globalAlpha = a;
    c.fillStyle = p.color;
    c.beginPath(); c.arc(p.x, p.y, p.size * a + 0.5, 0, 6.29); c.fill();
  }
  c.restore();
  c.globalAlpha = 1;
  // Floating texts: light fill, thin dark outline, soft glow behind.
  c.textAlign = 'center';
  c.font = 'bold 20px Georgia, serif';
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const f of g.floats) {
    const a = Math.max(0, 1 - f.t / f.life);
    glowCircle(c, f.x, f.y - 6, 26, '#ffe9a8', 0.35 * a);
  }
  c.restore();
  for (const f of g.floats) {
    c.globalAlpha = Math.max(0, 1 - f.t / f.life);
    c.strokeStyle = 'rgba(10,8,20,0.9)';
    c.lineWidth = 2.5;
    c.strokeText(f.text, f.x, f.y);
    c.fillStyle = f.color;
    c.fillText(f.text, f.x, f.y);
  }
  c.globalAlpha = 1;
}

function drawHud(c, g) {
  // Top bar.
  c.fillStyle = PALETTE.panel;
  rr(c, 16, 12, 560, 52, 12); c.fill();
  c.strokeStyle = PALETTE.panelEdge; c.lineWidth = 1.5;
  rr(c, 16, 12, 560, 52, 12); c.stroke();
  c.textAlign = 'left';
  c.fillStyle = PALETTE.gold;
  c.font = 'bold 26px Georgia, serif';
  c.fillText('☀', 34, 48);
  c.fillStyle = PALETTE.text;
  c.font = 'bold 24px Georgia, serif';
  c.fillText(String(g.sun), 66, 48);
  c.fillStyle = PALETTE.textDim;
  c.font = '16px Georgia, serif';
  c.fillText('WAVE  ' + Math.max(1, g.wave) + ' / ' + WAVES_TOTAL, 150, 46);
  c.fillText('SCORE  ' + g.score, 300, 46);
  c.fillText('BEST  ' + Math.max(g.best, g.score), 450, 46);
  // Lantern HP, top right.
  c.fillStyle = PALETTE.panel;
  rr(c, W - 300, 12, 284, 52, 12); c.fill();
  c.strokeStyle = PALETTE.panelEdge;
  rr(c, W - 300, 12, 284, 52, 12); c.stroke();
  c.fillStyle = PALETTE.textDim;
  c.font = '15px Georgia, serif';
  c.fillText('HEART LANTERN', W - 284, 34);
  const frac = Math.max(0, g.lanternHp / LANTERN.hp);
  c.fillStyle = 'rgba(255,255,255,0.18)';
  rr(c, W - 284, 40, 180, 12, 6); c.fill();
  c.fillStyle = frac > 0.5 ? '#ffd23e' : frac > 0.25 ? '#ff9a3c' : '#ff5d5d';
  if (frac > 0) { rr(c, W - 284, 40, 180 * frac, 12, 6); c.fill(); }
  c.fillStyle = PALETTE.text;
  c.font = 'bold 16px Georgia, serif';
  c.fillText(g.lanternHp + ' / ' + LANTERN.hp, W - 92, 51);
  // Build bar (bottom): plant cards.
  const bw = 250, bh = 74, gap = 14;
  const totalW = bw * 3 + gap * 2;
  const x0 = (W - totalW) / 2, y0 = H - bh - 12;
  BLOOM_ORDER.forEach((kind, i) => {
    const def = BLOOMS[kind];
    const x = x0 + i * (bw + gap);
    const afford = g.sun >= def.cost;
    const sel = g.selected === kind;
    c.fillStyle = sel ? 'rgba(255,210,62,0.20)' : PALETTE.panel;
    rr(c, x, y0, bw, bh, 12); c.fill();
    c.strokeStyle = sel ? PALETTE.gold : 'rgba(255,255,255,0.22)';
    c.lineWidth = sel ? 2.5 : 1.5;
    rr(c, x, y0, bw, bh, 12); c.stroke();
    // Mini bloom icon.
    c.save();
    c.globalCompositeOperation = 'lighter';
    glowCircle(c, x + 34, y0 + 37, 22, def.center, 0.5);
    c.restore();
    c.fillStyle = def.petal;
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * 6.28;
      c.beginPath(); c.ellipse(x + 34 + Math.cos(a) * 9, y0 + 37 + Math.sin(a) * 9, 6, 4, a, 0, 6.29); c.fill();
    }
    c.fillStyle = def.center;
    c.beginPath(); c.arc(x + 34, y0 + 37, 6, 0, 6.29); c.fill();
    c.textAlign = 'left';
    c.fillStyle = afford ? PALETTE.text : '#8a7f9e';
    c.font = 'bold 17px Georgia, serif';
    c.fillText(def.name, x + 62, y0 + 30);
    c.fillStyle = PALETTE.gold;
    c.font = '15px Georgia, serif';
    c.fillText('☀ ' + def.cost + '    [' + def.key + ']', x + 62, y0 + 54);
    c.fillStyle = PALETTE.textDim;
    c.font = '12px Georgia, serif';
    c.fillText(kind === 'ember' ? 'Fast bolts' : kind === 'frost' ? 'Slows wisps' : 'Heavy splash', x + 62, y0 + 70 - 2);
  });
  // Wave button / status, above the cards, right side.
  if (g.state === 'playing' && !g.waveActive && g.wave < WAVES_TOTAL) {
    const pulse = 0.6 + 0.4 * Math.sin(g.time * 4);
    c.fillStyle = 'rgba(255,210,62,' + (0.16 + 0.12 * pulse) + ')';
    rr(c, W - 250, H - 168, 234, 44, 10); c.fill();
    c.strokeStyle = PALETTE.gold; c.lineWidth = 2;
    rr(c, W - 250, H - 168, 234, 44, 10); c.stroke();
    c.fillStyle = PALETTE.text;
    c.font = 'bold 17px Georgia, serif';
    c.textAlign = 'center';
    c.fillText('START WAVE ' + (g.wave + 1) + '  [Space]', W - 133, H - 140);
    c.textAlign = 'left';
  }
  if (g.state === 'playing' && g.waveActive) {
    const label = 'Wisps left: ' + (g.wisps.length + g.spawnQueue.length);
    c.font = '15px Georgia, serif';
    const tw = c.measureText(label).width + 24;
    c.fillStyle = PALETTE.panel;
    rr(c, W - 16 - tw, H - 164, tw, 30, 8); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.22)';
    rr(c, W - 16 - tw, H - 164, tw, 30, 8); c.stroke();
    c.fillStyle = PALETTE.textDim;
    c.textAlign = 'right';
    c.fillText(label, W - 28, H - 143);
    c.textAlign = 'left';
  }
  // Wave banner.
  if (g.banner) {
    const bt = g.banner.t;
    const a = bt < 0.3 ? bt / 0.3 : bt > 1.9 ? Math.max(0, (2.4 - bt) / 0.5) : 1;
    const scale = bt < 0.3 ? 0.8 + 0.4 * (bt / 0.3) : 1;
    c.save();
    c.globalAlpha = a;
    c.translate(W / 2, 210);
    c.scale(scale, scale);
    c.textAlign = 'center';
    c.font = 'bold 64px Georgia, serif';
    c.shadowColor = '#ffb347'; c.shadowBlur = 30;
    c.fillStyle = '#fff6dd';
    c.fillText(g.banner.text, 0, 0);
    c.shadowBlur = 0;
    c.font = 'italic 22px Georgia, serif';
    c.fillStyle = '#e8d9b0';
    c.fillText(g.banner.sub, 0, 38);
    c.restore();
  }
}

function drawTitle(c, g, t) {
  // The Heart Lantern sits at the garden's center: keep the title block above
  // it and the call-to-action below it so no text fights the lantern.
  c.fillStyle = 'rgba(7,8,26,0.5)';
  c.fillRect(0, 0, W, H);
  c.textAlign = 'center';
  c.save();
  c.shadowColor = '#ffb347'; c.shadowBlur = 42;
  c.fillStyle = '#fff6dd';
  c.font = 'bold 92px Georgia, serif';
  c.fillText('LUMEN GROVE', W / 2, 168);
  c.restore();
  c.font = 'italic 26px Georgia, serif';
  c.fillStyle = '#e8d9b0';
  c.fillText('a lantern-garden defense', W / 2, 212);
  const pulse = 0.65 + 0.35 * Math.sin(t * 3);
  c.globalAlpha = pulse;
  c.fillStyle = PALETTE.gold;
  c.font = 'bold 28px Georgia, serif';
  c.fillText('— Click to begin —', W / 2, 566);
  c.globalAlpha = 1;
  c.fillStyle = PALETTE.textDim;
  c.font = '17px Georgia, serif';
  c.fillText('Plant light-blooms on the soil plots. Stop the shadow wisps before they reach the Heart Lantern.', W / 2, 616);
  c.fillText('Mouse: plant / sell   •   1 / 2 / 3: choose bloom   •   Space: next wave   •   P: pause   •   M: mute', W / 2, 648);
  if (g.best > 0) {
    c.fillStyle = PALETTE.gold;
    c.font = 'bold 19px Georgia, serif';
    c.fillText('Best score: ' + g.best, W / 2, 690);
  }
  c.textAlign = 'left';
}

function drawEnd(c, g, won) {
  c.fillStyle = won ? 'rgba(10,26,14,0.55)' : 'rgba(20,6,16,0.6)';
  c.fillRect(0, 0, W, H);
  // Solid panel so the garden never fights the text.
  c.fillStyle = 'rgba(10,12,34,0.82)';
  rr(c, 240, 150, 800, 400, 18); c.fill();
  c.strokeStyle = won ? 'rgba(255,210,62,0.6)' : 'rgba(255,93,93,0.5)';
  c.lineWidth = 2;
  rr(c, 240, 150, 800, 400, 18); c.stroke();
  c.textAlign = 'center';
  c.save();
  c.shadowColor = won ? '#ffd23e' : '#ff5d5d';
  c.shadowBlur = 36;
  c.fillStyle = '#fff6dd';
  c.font = 'bold 62px Georgia, serif';
  c.fillText(won ? 'THE GROVE BLOOMS' : 'THE LIGHT FADES', W / 2, 240);
  c.restore();
  c.font = 'italic 24px Georgia, serif';
  c.fillStyle = '#e8d9b0';
  c.fillText(won ? 'Ten waves weathered — dawn belongs to the garden.' : 'The wisps swallowed the last flame… this time.', W / 2, 286);
  if (won) {
    const stars = g.lanternHp >= 15 ? 3 : g.lanternHp >= 8 ? 2 : 1;
    c.font = '44px Georgia, serif';
    c.fillStyle = PALETTE.gold;
    let s = '';
    for (let i = 0; i < 3; i++) s += i < stars ? '★' : '☆';
    c.fillText(s, W / 2, 350);
  }
  c.fillStyle = PALETTE.text;
  c.font = '21px Georgia, serif';
  c.fillText('Score  ' + g.score + '      •      Waves  ' + g.wave + ' / ' + WAVES_TOTAL +
    '      •      Wisps banished  ' + g.stats.banished, W / 2, 410);
  c.fillText('Sunpetals earned  ' + g.stats.earned + '      •      Best  ' + Math.max(g.best, g.score), W / 2, 444);
  const pulse = 0.65 + 0.35 * Math.sin(g.time * 3);
  c.globalAlpha = pulse;
  c.fillStyle = PALETTE.gold;
  c.font = 'bold 24px Georgia, serif';
  c.fillText('— Press R or click to play again —', W / 2, 510);
  c.globalAlpha = 1;
  c.textAlign = 'left';
}

export function render(c, g, t, input) {
  c.save();
  if (g.shake > 0) {
    const s = g.shake * 9;
    c.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  drawBackground(c, t);
  // Hover range ring.
  if (g.state === 'playing' && input && input.mouseIn && g.hoverPlot) {
    const def = BLOOMS[g.selected];
    c.strokeStyle = 'rgba(255,210,62,0.35)';
    c.lineWidth = 2;
    c.setLineDash([6, 6]);
    c.beginPath(); c.arc(g.hoverPlot.x, g.hoverPlot.y - 14, def.range, 0, 6.29); c.stroke();
    c.setLineDash([]);
  }
  for (const plot of g.plots) drawPlot(c, plot, t, plot === g.hoverPlot);
  drawLantern(c, g, t);
  for (const plot of g.plots) if (plot.bloom) drawBloom(c, plot, t);
  for (const w of g.wisps) drawWisp(c, w, t);
  drawBolts(c, g);
  drawParticles(c, g);
  c.restore();
  // Damage vignette.
  if (g.flash > 0) {
    const grad = c.createRadialGradient(640, 360, 240, 640, 360, 720);
    grad.addColorStop(0, 'rgba(255,60,40,0)');
    grad.addColorStop(1, 'rgba(255,60,40,' + (0.45 * g.flash) + ')');
    c.fillStyle = grad;
    c.fillRect(0, 0, W, H);
  }
  if (g.state === 'title') drawTitle(c, g, t);
  else if (g.state === 'playing' || g.state === 'paused') {
    drawHud(c, g);
    if (g.state === 'paused') {
      c.fillStyle = 'rgba(7,8,26,0.6)';
      c.fillRect(0, 0, W, H);
      c.textAlign = 'center';
      c.fillStyle = '#fff6dd';
      c.font = 'bold 56px Georgia, serif';
      c.fillText('PAUSED', W / 2, 350);
      c.font = '20px Georgia, serif';
      c.fillStyle = PALETTE.textDim;
      c.fillText('Press P to resume', W / 2, 392);
      c.textAlign = 'left';
    }
  } else if (g.state === 'won' || g.state === 'lost') {
    drawHud(c, g);
    drawEnd(c, g, g.state === 'won');
  }
}
