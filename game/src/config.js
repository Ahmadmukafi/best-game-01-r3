// config.js — tuning and palette for Lumen Grove (one place, one job).
export const W = 1280;
export const H = 720;
export const LANTERN = { x: 640, y: 372, hp: 20, radius: 46 };
export const START_SUN = 150;
export const SELL_REFUND = 0.7;
export const WAVES_TOTAL = 10;
export const BUILD_AUTO_START_S = 15;

// Bloom types: name, key, cost, range, damage, shots per second, bolt speed,
// bolt color, petal color, petal edge, center color, slow (0 = none, else
// {factor, seconds}), splash radius (0 = none).
export const BLOOMS = {
  ember: {
    name: 'Ember Bloom', key: '1', cost: 50, range: 155, damage: 14, rate: 2.2,
    boltSpeed: 520, bolt: '#ffb347', petal: '#ff7a3c', edge: '#ffd27a', center: '#fff3b0',
    slow: null, splash: 0, petals: 6, size: 20,
  },
  frost: {
    name: 'Frost Bloom', key: '2', cost: 75, range: 145, damage: 6, rate: 1.4,
    boltSpeed: 430, bolt: '#8fe8ff', petal: '#7fd4ff', edge: '#dff6ff', center: '#ffffff',
    slow: { factor: 0.55, seconds: 1.6 }, splash: 0, petals: 6, size: 19,
  },
  sun: {
    name: 'Sun Bloom', key: '3', cost: 120, range: 195, damage: 34, rate: 0.8,
    boltSpeed: 380, bolt: '#ffe066', petal: '#ffd23e', edge: '#fff7ae', center: '#fffbe6',
    slow: null, splash: 55, petals: 8, size: 24,
  },
};
export const BLOOM_ORDER = ['ember', 'frost', 'sun'];

// Wisp kinds: hp base, speed, reward, lantern damage, radius, colors.
export const WISPS = {
  wisp: { hp: 30, speed: 32, reward: 8, damage: 1, radius: 15, body: '#241a3d', eye: '#c9a7ff', score: 80 },
  swift: { hp: 18, speed: 58, reward: 10, damage: 1, radius: 11, body: '#1a2a3d', eye: '#7fe8ff', score: 100 },
  brute: { hp: 115, speed: 22, reward: 16, damage: 3, radius: 23, body: '#33141f', eye: '#ff5d5d', score: 160 },
};

// Wave n (1-based): how many of each kind, spawn gap, hp multiplier.
export function waveComp(n) {
  const total = 6 + 3 * n;
  const brutes = n >= 4 ? Math.floor((n - 2) / 2) : 0;
  const swifts = Math.min(2 + n, Math.floor(total * 0.35));
  const wisps = Math.max(3, total - brutes - swifts);
  return {
    wisps, swifts, brutes,
    gap: Math.max(0.55, 1.5 - n * 0.09),
    hpMul: 1 + (n - 1) * 0.25,
    speedMul: 1 + (n - 1) * 0.05,
  };
}

export const PALETTE = {
  skyTop: '#0a0e2a', skyMid: '#241b4d', skyLow: '#57295e', horizon: '#b3543f',
  hillFar: '#1c1440', hillMid: '#150f33', ground: '#12291f', groundEdge: '#0c1d16',
  soil: '#3a2417', soilRim: '#5a3a24', grass: '#2f7a4e', grassLight: '#57b878',
  moon: '#ffeec2', moonGlow: 'rgba(255,238,194,0.35)',
  panel: 'rgba(10,12,34,0.72)', panelEdge: 'rgba(255,210,122,0.45)',
  text: '#fff6dd', textDim: '#cfc4ee', gold: '#ffd23e',
};

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
