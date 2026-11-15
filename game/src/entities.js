// entities.js — blooms, wisps, bolts, particles. One job: entity behaviour.
import { BLOOMS, WISPS, LANTERN } from './config.js';
import { edgeSpawn } from './world.js';

let nextId = 1;

export function makeWisp(kind, hpMul, speedMul, rng) {
  const base = WISPS[kind];
  const p = edgeSpawn(rng);
  return {
    id: nextId++, kind, x: p.x, y: p.y,
    hp: base.hp * hpMul, maxHp: base.hp * hpMul,
    speed: base.speed * speedMul * (0.9 + rng() * 0.2),
    reward: base.reward, damage: base.damage, radius: base.radius,
    score: base.score, slowT: 0, wob: rng() * 6.28, hitT: 0,
    tx: LANTERN.x, ty: LANTERN.y,
  };
}

export function makeBolt(x, y, target, def, kind) {
  return {
    x, y, target, kind,
    damage: def.damage, speed: def.boltSpeed, splash: def.splash,
    slow: def.slow, color: def.bolt, dead: false, trail: [],
  };
}

export function burst(parts, x, y, color, n, speed, life, size) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.3 + Math.random() * 0.7);
    parts.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20,
      life: life * (0.6 + Math.random() * 0.6), maxLife: life,
      size: size * (0.6 + Math.random() * 0.8), color, drag: 0.92, grav: 60,
    });
  }
}

export function spawnFloat(floats, x, y, text, color) {
  floats.push({ x, y, text, color: color || '#ffe9a8', t: 0, life: 1.1 });
}

export function updateWisps(g, dt, rng) {
  for (const w of g.wisps) {
    if (w.slowT > 0) w.slowT -= dt;
    if (w.hitT > 0) w.hitT -= dt;
    w.wob += dt * 3;
    const sp = w.speed * (w.slowT > 0 ? 0.55 : 1);
    const dx = w.tx - w.x, dy = w.ty - w.y;
    const d = Math.hypot(dx, dy) || 1;
    // Wobble sideways as they drift in, like smoke.
    const px = -dy / d, py = dx / d;
    const wob = Math.sin(w.wob) * 14;
    w.x += (dx / d) * sp * dt + px * wob * dt;
    w.y += (dy / d) * sp * dt + py * wob * dt;
    if (d < LANTERN.radius + w.radius * 0.4) {
      w.dead = true;
      g.lanternHp -= w.damage;
      g.shake = Math.min(1, g.shake + 0.55);
      g.flash = 0.55;
      burst(g.parts, LANTERN.x, LANTERN.y - 20, '#ff6b5e', 16, 220, 0.6, 4);
    }
  }
  g.wisps = g.wisps.filter((w) => !w.dead);
}

export function updateBlooms(g, dt) {
  for (const plot of g.plots) {
    const b = plot.bloom;
    if (!b) continue;
    b.cool -= dt;
    b.sway += dt;
    if (b.cool > 0) continue;
    // Nearest wisp in range.
    let best = null, bestD = Infinity;
    for (const w of g.wisps) {
      const d = Math.hypot(w.x - plot.x, w.y - (plot.y - 26));
      if (d < b.def.range && d < bestD) { best = w; bestD = d; }
    }
    if (!best) continue;
    b.cool = 1 / b.def.rate;
    b.flash = 0.12;
    g.bolts.push(makeBolt(plot.x, plot.y - 30, best, b.def, b.kind));
  }
}

export function updateBolts(g, dt) {
  for (const bolt of g.bolts) {
    const t = bolt.target;
    if (!t || t.dead || t.hp <= 0) { bolt.dead = true; continue; }
    const dx = t.x - bolt.x, dy = t.y - bolt.y;
    const d = Math.hypot(dx, dy) || 1;
    const step = bolt.speed * dt;
    bolt.trail.push({ x: bolt.x, y: bolt.y });
    if (bolt.trail.length > 5) bolt.trail.shift();
    if (step >= d) {
      bolt.dead = true;
      hitWisp(g, t, bolt);
    } else {
      bolt.x += (dx / d) * step;
      bolt.y += (dy / d) * step;
    }
  }
  g.bolts = g.bolts.filter((b) => !b.dead);
}

function hitWisp(g, w, bolt) {
  w.hp -= bolt.damage;
  w.hitT = 0.12;
  if (bolt.slow) w.slowT = bolt.slow.seconds;
  burst(g.parts, w.x, w.y, bolt.color, bolt.splash > 0 ? 14 : 6, 160, 0.45, 3.5);
  if (bolt.splash > 0) {
    for (const o of g.wisps) {
      if (o === w || o.dead) continue;
      const d = Math.hypot(o.x - w.x, o.y - w.y);
      if (d < bolt.splash) { o.hp -= bolt.damage * 0.5; o.hitT = 0.12; }
    }
  }
  if (w.hp <= 0 && !w.dead) {
    w.dead = true;
    g.stats.banished += 1;
    g.sun += w.reward;
    g.score += w.score;
    g.stats.earned += w.reward;
    spawnFloat(g.floats, w.x, w.y - 14, '+' + w.reward, '#ffe9a8');
    burst(g.parts, w.x, w.y, '#c9a7ff', 18, 240, 0.7, 4);
    burst(g.parts, w.x, w.y, '#ffffff', 6, 120, 0.4, 2.5);
  }
}

export function updateParticles(g, dt) {
  for (const p of g.parts) {
    p.life -= dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= p.drag; p.vy = p.vy * p.drag + p.grav * dt;
  }
  g.parts = g.parts.filter((p) => p.life > 0);
  for (const f of g.floats) { f.t += dt; f.y -= 34 * dt; }
  g.floats = g.floats.filter((f) => f.t < f.life);
  if (g.banner) { g.banner.t += dt; if (g.banner.t > 2.4) g.banner = null; }
  if (g.shake > 0) g.shake = Math.max(0, g.shake - dt * 1.6);
  if (g.flash > 0) g.flash = Math.max(0, g.flash - dt * 1.8);
}
