// world.js — garden layout, waves, spawning, economy. One job: the world.
import { W, H, LANTERN, START_SUN, WAVES_TOTAL, waveComp } from './config.js';

export function buildPlots() {
  // Two arcs of soil plots around the Heart Lantern, with a clear lane at the
  // bottom center where the wave banner and build button sit.
  const plots = [];
  const rings = [
    { r: 165, n: 8, phase: 0.35 },
    { r: 262, n: 10, phase: 0.05 },
  ];
  for (const ring of rings) {
    for (let i = 0; i < ring.n; i++) {
      const a = ring.phase + (i / ring.n) * Math.PI * 2;
      const x = LANTERN.x + Math.cos(a) * ring.r;
      const y = LANTERN.y + Math.sin(a) * ring.r * 0.82;
      if (y > H - 108) continue; // keep the bottom strip clear
      plots.push({ x, y, r: 30, bloom: null, sway: Math.random() * 6.28 });
    }
  }
  return plots;
}

export function edgeSpawn(rng) {
  // Spawn just outside a random screen edge.
  const side = Math.floor(rng() * 4);
  const m = 30;
  if (side === 0) return { x: -m, y: 60 + rng() * (H - 160) };
  if (side === 1) return { x: W + m, y: 60 + rng() * (H - 160) };
  if (side === 2) return { x: 80 + rng() * (W - 160), y: -m };
  return { x: 80 + rng() * (W - 160), y: H + m };
}

export function createGame() {
  return {
    state: 'title', // title | playing | paused | won | lost
    time: 0,
    wave: 0,
    sun: START_SUN,
    score: 0,
    best: 0,
    lanternHp: LANTERN.hp,
    plots: buildPlots(),
    wisps: [],
    bolts: [],
    parts: [],
    floats: [], // floating score / refund texts
    spawnQueue: [],
    spawnTimer: 0,
    waveActive: false,
    buildTimer: 0,
    shake: 0,
    flash: 0,
    banner: null, // {text, sub, t}
    selected: 'ember',
    hoverPlot: null,
    stats: { banished: 0, planted: 0, earned: 0 },
    bestLoaded: false,
  };
}

export function startWave(g, rng) {
  if (g.wave >= WAVES_TOTAL) return false;
  g.wave += 1;
  const comp = waveComp(g.wave);
  const q = [];
  for (let i = 0; i < comp.wisps; i++) q.push('wisp');
  for (let i = 0; i < comp.swifts; i++) q.push('swift');
  for (let i = 0; i < comp.brutes; i++) q.push('brute');
  // Shuffle, but keep brutes out of the very first spawns.
  for (let i = q.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [q[i], q[j]] = [q[j], q[i]];
  }
  q.sort((a, b) => (a === 'brute' ? 1 : 0) - (b === 'brute' ? 1 : 0));
  g.spawnQueue = q.map((kind) => ({ kind, hpMul: comp.hpMul, speedMul: comp.speedMul }));
  g.spawnTimer = 0.6;
  g.waveActive = true;
  g.banner = { text: 'WAVE ' + g.wave, sub: waveTitle(g.wave), t: 0 };
  return true;
}

export function waveTitle(n) {
  const names = [
    '', 'First stirrings', 'The mist thickens', 'Swift shadows', 'Heavy footsteps',
    'The grove holds its breath', 'A cold wind', 'Eyes in the dark', 'The long night',
    'The storm breaks', 'Dawn or darkness',
  ];
  return names[n] || '';
}

export function waveClearBonus(wave) {
  return 40 + 10 * wave;
}
