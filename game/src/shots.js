// shots.js — deterministic screenshot scenes (?shot=start|play|end&seed=N).
// Builds a fixed game state, advances it a fixed simulated time, renders one
// frame, then sets window.__shotReady. No wall clock, no Math.random in the
// scene itself: everything comes from the seeded generator.
import { createGame, startWave } from './world.js';
import { BLOOMS } from './config.js';
import { makeWisp, updateWisps, updateBlooms, updateBolts, updateParticles, burst } from './entities.js';
import { mulberry32 } from './config.js';
import { render } from './render.js';

function plant(g, plotIdx, kind) {
  const plot = g.plots[plotIdx];
  if (!plot) return;
  plot.bloom = { kind, def: BLOOMS[kind], cool: 0, sway: plot.sway, flash: 0 };
}

function stepSim(g, dt, steps, rng) {
  for (let i = 0; i < steps; i++) {
    g.time += dt;
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
  }
}

export function renderShot(c, kind, seed) {
  const rng = mulberry32(seed || 1);
  const g = createGame();
  g.best = 1240;
  if (kind === 'start') {
    // Title over a living garden: blooms planted, wisps drifting past.
    g.state = 'title';
    plant(g, 1, 'ember'); plant(g, 3, 'frost'); plant(g, 5, 'sun');
    plant(g, 9, 'ember'); plant(g, 12, 'sun'); plant(g, 14, 'frost');
    for (let i = 0; i < 5; i++) {
      const w = makeWisp(i % 2 ? 'swift' : 'wisp', 1, 1, rng);
      w.x = 150 + i * 220; w.y = 180 + (i % 3) * 130;
      g.wisps.push(w);
    }
    g.time = 3.2;
    for (let i = 0; i < 100; i++) updateParticles(g, 1 / 60);
    render(c, g, g.time, null);
  } else if (kind === 'play') {
    // Mid-wave 4: half the garden planted, wisps mid-field, bolts flying.
    g.state = 'playing';
    g.wave = 3; // startWave() below increments to 4
    g.sun = 235; g.score = 1840;
    plant(g, 0, 'ember'); plant(g, 1, 'frost'); plant(g, 2, 'sun');
    plant(g, 4, 'ember'); plant(g, 6, 'frost'); plant(g, 7, 'ember');
    plant(g, 10, 'sun'); plant(g, 12, 'ember'); plant(g, 15, 'frost');
    startWave(g, rng);
    // Pre-place a few wisps mid-field, close to planted blooms so bolts are
    // already flying when the frame is taken.
    const spots = [[760, 380], [660, 460], [520, 360], [700, 280], [700, 520], [450, 450]];
    spots.forEach(([x, y], i) => {
      const w = makeWisp(i % 3 === 2 ? 'brute' : i % 3 === 1 ? 'swift' : 'wisp', 1.66, 1.12, rng);
      w.x = x; w.y = y;
      g.wisps.push(w);
    });
    burst(g.parts, 700, 300, '#ffb347', 10, 180, 0.5, 3.5);
    burst(g.parts, 500, 420, '#8fe8ff', 8, 150, 0.5, 3);
    stepSim(g, 1 / 60, 150, rng); // 2.5 s of battle, bolts in flight
    g.banner = { text: 'WAVE 4', sub: 'Heavy footsteps', t: 0.9 };
    render(c, g, g.time, null);
  } else {
    // Victory screen with 3 stars and full stats.
    g.state = 'won';
    g.wave = 10; g.score = 4860; g.lanternHp = 17;
    g.stats.banished = 214; g.stats.earned = 1830;
    plant(g, 0, 'ember'); plant(g, 2, 'sun'); plant(g, 5, 'frost'); plant(g, 8, 'ember');
    g.time = 2.0;
    render(c, g, g.time, null);
  }
  window.__shotReady = true;
  return g;
}
