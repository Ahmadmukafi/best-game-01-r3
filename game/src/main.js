// main.js — bootstrap, fixed-step loop, state machine, interactions.
// One job: run the game.
import { W, H, LANTERN, BLOOMS, BLOOM_ORDER, START_SUN, WAVES_TOTAL, BUILD_AUTO_START_S, mulberry32 } from './config.js';
import { createInput } from './input.js';
import { createGame, startWave, waveClearBonus } from './world.js';
import { makeWisp, updateWisps, updateBlooms, updateBolts, updateParticles, burst, spawnFloat } from './entities.js';
import { render } from './render.js';
import { renderShot } from './shots.js';
import { sfx, unlockAudio, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(location.search);
const shotKind = params.get('shot');
const shotSeed = parseInt(params.get('seed') || '1', 10) || 1;

const g = createGame();
window.__game = g; // debug/testing hook: lets scripted play-tests read state
try {
  g.best = parseInt(localStorage.getItem('lumen-grove-best') || '0', 10) || 0;
  g.bestLoaded = true;
} catch (e) { g.best = 0; }

const rng = mulberry32((Date.now() % 2147483647) || 7);
const input = createInput(canvas, onClick, onKey);

function saveBest() {
  try { localStorage.setItem('lumen-grove-best', String(Math.max(g.best, g.score))); } catch (e) {}
}

function resetGame() {
  const best = Math.max(g.best, g.score);
  const fresh = createGame();
  fresh.best = best;
  Object.assign(g, fresh);
  g.best = best;
}

function plantAt(plot) {
  const def = BLOOMS[g.selected];
  if (plot.bloom) {
    // Sell the bloom for a 70% refund.
    const refund = Math.floor(def.cost * 0.7);
    const soldDef = plot.bloom.def;
    const back = Math.floor(soldDef.cost * 0.7);
    plot.bloom = null;
    g.sun += back;
    g.stats.earned += 0;
    spawnFloat(g.floats, plot.x, plot.y - 40, '+' + back, '#ffe9a8');
    sfx.sell();
    return;
  }
  if (g.sun < def.cost) { sfx.denied(); spawnFloat(g.floats, plot.x, plot.y - 40, 'need ☀' + def.cost, '#ff9a9a'); return; }
  g.sun -= def.cost;
  plot.bloom = { kind: g.selected, def, cool: 0, sway: plot.sway, flash: 0 };
  g.stats.planted += 1;
  burst(g.parts, plot.x, plot.y - 20, def.center, 14, 160, 0.6, 3.5);
  sfx.plant();
}

function plotAt(x, y) {
  let best = null, bestD = Infinity;
  for (const p of g.plots) {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < 36 && d < bestD) { best = p; bestD = d; }
  }
  return best;
}

function cardAt(x, y) {
  const bw = 250, bh = 74, gap = 14;
  const totalW = bw * 3 + gap * 2;
  const x0 = (W - totalW) / 2, y0 = H - bh - 12;
  if (y < y0 || y > y0 + bh) return null;
  for (let i = 0; i < 3; i++) {
    const x1 = x0 + i * (bw + gap);
    if (x >= x1 && x <= x1 + bw) return BLOOM_ORDER[i];
  }
  return null;
}

function onClick(x, y) {
  unlockAudio();
  if (g.state === 'title') {
    // Clear the ambient title-screen wisps: they must not leak into the run.
    g.wisps = [];
    g.parts = [];
    g.state = 'playing';
    g.buildTimer = BUILD_AUTO_START_S;
    sfx.click();
    return;
  }
  if (g.state === 'won' || g.state === 'lost') { resetGame(); g.state = 'playing'; g.buildTimer = BUILD_AUTO_START_S; sfx.click(); return; }
  if (g.state !== 'playing') return;
  const card = cardAt(x, y);
  if (card) { g.selected = card; sfx.click(); return; }
  // Wave start button.
  if (!g.waveActive && g.wave < WAVES_TOTAL && x >= W - 250 && x <= W - 16 && y >= H - 168 && y <= H - 124) {
    startWave(g, rng);
    sfx.wave();
    return;
  }
  const plot = plotAt(x, y);
  if (plot) plantAt(plot);
}

function onKey(code) {
  unlockAudio();
  if (code === 'KeyM') { toggleMute(); return; }
  if (g.state === 'title') {
    if (code === 'Space' || code === 'Enter') {
      g.wisps = [];
      g.parts = [];
      g.state = 'playing'; g.buildTimer = BUILD_AUTO_START_S; sfx.click();
    }
    return;
  }
  if (g.state === 'won' || g.state === 'lost') {
    if (code === 'KeyR' || code === 'Space' || code === 'Enter') { resetGame(); g.state = 'playing'; g.buildTimer = BUILD_AUTO_START_S; sfx.click(); }
    return;
  }
  if (code === 'KeyP' || code === 'Escape') {
    g.state = g.state === 'paused' ? 'playing' : 'paused';
    return;
  }
  if (g.state !== 'playing') return;
  if (code === 'Digit1') g.selected = 'ember';
  else if (code === 'Digit2') g.selected = 'frost';
  else if (code === 'Digit3') g.selected = 'sun';
  else if (code === 'Space') {
    if (!g.waveActive && g.wave < WAVES_TOTAL) { startWave(g, rng); sfx.wave(); }
  } else if (code === 'KeyR') { resetGame(); g.state = 'playing'; g.buildTimer = BUILD_AUTO_START_S; }
}

function update(dt) {
  g.time += dt;
  if (g.state === 'title') {
    // Ambient drift behind the title.
    if (Math.random() < dt * 0.5 && g.wisps.length < 5) {
      g.wisps.push(makeWisp('wisp', 1, 0.6, rng));
    }
    updateWisps(g, dt, rng);
    updateParticles(g, dt);
    return;
  }
  if (g.state !== 'playing') { updateParticles(g, dt); return; }
  // Hover tracking.
  g.hoverPlot = input.mouseIn ? plotAt(input.mx, input.my) : null;
  // Build-phase auto-start.
  if (!g.waveActive && g.wave < WAVES_TOTAL) {
    g.buildTimer -= dt;
    if (g.buildTimer <= 0) { startWave(g, rng); sfx.wave(); }
  }
  // Spawning.
  if (g.spawnQueue.length > 0) {
    g.spawnTimer -= dt;
    if (g.spawnTimer <= 0) {
      const s = g.spawnQueue.shift();
      g.wisps.push(makeWisp(s.kind, s.hpMul, s.speedMul, rng));
      g.spawnTimer = 1.1;
    }
  }
  updateWisps(g, dt, rng);
  updateBlooms(g, dt);
  updateBolts(g, dt);
  updateParticles(g, dt);
  // Lantern destroyed?
  if (g.lanternHp <= 0) {
    g.lanternHp = 0;
    g.state = 'lost';
    saveBest();
    sfx.lose();
    burst(g.parts, LANTERN.x, LANTERN.y - 40, '#ff6b5e', 40, 320, 1.2, 5);
    return;
  }
  // Wave cleared?
  if (g.waveActive && g.spawnQueue.length === 0 && g.wisps.length === 0) {
    g.waveActive = false;
    const bonus = waveClearBonus(g.wave);
    g.sun += bonus;
    g.score += bonus * 5;
    spawnFloat(g.floats, LANTERN.x, LANTERN.y - 120, 'WAVE CLEAR  +' + bonus + ' ☀', '#ffe9a8');
    sfx.banish();
    if (g.wave >= WAVES_TOTAL) {
      g.state = 'won';
      saveBest();
      sfx.win();
    } else {
      g.buildTimer = BUILD_AUTO_START_S;
    }
  }
}

// Fixed-step loop.
let last = performance.now();
let acc = 0;
const STEP = 1 / 60;

function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.25) dt = 0.25;
  acc += dt;
  while (acc >= STEP) { update(STEP); acc -= STEP; }
  render(ctx, g, g.time, input);
}

if (shotKind) {
  // Deterministic screenshot render: one frame, then signal readiness.
  renderShot(ctx, shotKind, shotSeed);
} else {
  requestAnimationFrame(frame);
}
