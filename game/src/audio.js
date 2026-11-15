// audio.js — procedural WebAudio sound effects, no assets. One job: sound.
let ctx = null;
let master = null;
let muted = false;

function ensure() {
  if (ctx) return true;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
    return true;
  } catch (e) { return false; }
}

export function unlockAudio() {
  if (ensure() && ctx.state === 'suspended') ctx.resume();
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.35;
  return muted;
}

function tone(freq, dur, type, vol, slideTo) {
  if (!ensure() || muted) return;
  const t0 = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
  g.gain.setValueAtTime(vol || 0.2, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(master);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

function noise(dur, vol, low) {
  if (!ensure() || muted) return;
  const t0 = ctx.currentTime;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = low || 1200;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol || 0.25, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t0);
}

export const sfx = {
  shoot(kind) {
    if (kind === 'sun') tone(520, 0.16, 'triangle', 0.22, 180);
    else if (kind === 'frost') tone(880, 0.1, 'sine', 0.14, 1400);
    else tone(660, 0.08, 'square', 0.08, 320);
  },
  hit() { noise(0.08, 0.16, 900); },
  banish() { tone(520, 0.18, 'sine', 0.18, 1040); tone(780, 0.22, 'sine', 0.12, 1560); },
  plant() { tone(392, 0.1, 'sine', 0.2); setTimeout(() => tone(523, 0.12, 'sine', 0.2), 70); setTimeout(() => tone(659, 0.16, 'sine', 0.18), 140); },
  sell() { tone(659, 0.09, 'sine', 0.15, 392); },
  denied() { tone(140, 0.16, 'sawtooth', 0.14, 90); },
  wave() { tone(220, 0.5, 'sawtooth', 0.12, 440); tone(330, 0.5, 'sawtooth', 0.08, 495); },
  lanternHit() { tone(98, 0.3, 'sine', 0.3, 55); noise(0.2, 0.2, 500); },
  win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.2), i * 130)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.35, 'triangle', 0.18), i * 160)); },
  click() { tone(700, 0.05, 'sine', 0.12); },
};
