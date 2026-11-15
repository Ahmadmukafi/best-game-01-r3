// input.js — mouse + keyboard state. One job: input.
export function createInput(canvas, onClick, onKey) {
  const input = {
    mx: -100, my: -100, mouseIn: false,
    keys: new Set(),
  };
  function toGame(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height),
    };
  }
  canvas.addEventListener('mousemove', (e) => {
    const p = toGame(e);
    input.mx = p.x; input.my = p.y; input.mouseIn = true;
  });
  canvas.addEventListener('mouseleave', () => { input.mouseIn = false; });
  canvas.addEventListener('mousedown', (e) => {
    const p = toGame(e);
    input.mx = p.x; input.my = p.y;
    if (onClick) onClick(p.x, p.y, e.button);
  });
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    input.keys.add(e.code);
    if (onKey) onKey(e.code, e.key);
    if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => input.keys.delete(e.code));
  return input;
}
