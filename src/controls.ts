import { Engine } from './engine';

/** Joystick virtual (izquierda) + arrastrar para mirar (derecha) + WASD/ratón */
export function setupControls(eng: Engine, layer: HTMLElement) {
  const joy = document.getElementById('joy')!, knob = document.getElementById('joyKnob')!;
  let joyId: number | null = null, lookId: number | null = null;
  let jx = 0, jy = 0, lx = 0, ly = 0;
  const R = 55;
  layer.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('button,.ui')) return;
    const left = e.clientX < innerWidth * 0.42;
    if (left && joyId == null && eng.canWalk && e.pointerType !== 'mouse') {
      joyId = e.pointerId; jx = e.clientX; jy = e.clientY;
      joy.style.left = (jx - R) + 'px'; joy.style.top = (jy - R) + 'px'; joy.classList.add('on');
    } else if (lookId == null) { lookId = e.pointerId; lx = e.clientX; ly = e.clientY; }
    layer.setPointerCapture(e.pointerId);
  });
  layer.addEventListener('pointermove', (e) => {
    if (e.pointerId === joyId) {
      let dx = e.clientX - jx, dy = e.clientY - jy; const d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      eng.move.set(dx / R, -dy / R); eng.running = d > R * 0.95;
    } else if (e.pointerId === lookId) {
      const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      const k = e.pointerType === 'mouse' ? 0.005 : 0.007;
      if (eng.mode === 'walk') { eng.yaw -= dx * k; eng.pitch = Math.max(-0.9, Math.min(1.1, eng.pitch + dy * k)); }
      else { eng.freeLook.yaw = Math.max(-0.8, Math.min(0.8, eng.freeLook.yaw - dx * k * 0.6)); eng.freeLook.pitch = Math.max(-0.4, Math.min(0.4, eng.freeLook.pitch - dy * k * 0.6)); }
    }
  });
  const end = (e: PointerEvent) => {
    if (e.pointerId === joyId) { joyId = null; eng.move.set(0, 0); eng.running = false; knob.style.transform = ''; joy.classList.remove('on'); }
    if (e.pointerId === lookId) lookId = null;
  };
  layer.addEventListener('pointerup', end); layer.addEventListener('pointercancel', end);
  layer.addEventListener('wheel', (e) => { eng.dist = Math.max(1.8, Math.min(7, eng.dist + e.deltaY * 0.004)); }, { passive: true });
  addEventListener('keydown', (e) => { if ((e.target as HTMLElement)?.id === 'kb') return; eng.keys.add(e.code); });
  addEventListener('keyup', (e) => eng.keys.delete(e.code));
  addEventListener('blur', () => eng.keys.clear());
}
