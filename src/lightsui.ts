// Mesas de luces flotantes (estilo GLights): una por grupo de aparatos
import type { Engine } from './engine';
import { GroupId, SubState, SWATCHES, SPEEDS, FADES } from './lights';

const NAMES: Record<GroupId, string> = { heads: 'Heads', linebars: 'LineBars', washes: 'Washes', leds: 'LEDs' };
const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');
const CAP: Record<GroupId, { beam: boolean; gobo: boolean; spread: boolean; pos: boolean; pan: boolean; follow: boolean }> = {
  heads: { beam: true, gobo: true, spread: true, pos: true, pan: true, follow: true },
  washes: { beam: true, gobo: false, spread: true, pos: true, pan: true, follow: true },
  linebars: { beam: true, gobo: false, spread: false, pos: true, pan: false, follow: false },
  leds: { beam: false, gobo: false, spread: false, pos: false, pan: false, follow: false },
};

export function setupLightsUI(eng: Engine) {
  const root = document.createElement('div'); root.id = 'lightsUI'; root.className = 'hidden';
  document.getElementById('app')!.appendChild(root);
  const tabs = document.createElement('div'); tabs.className = 'ltabs ui'; root.appendChild(tabs);
  const open = new Set<GroupId>(['heads']); let plus = false;
  const panels: Partial<Record<GroupId, HTMLElement>> = {};
  const small = () => innerWidth < 900;
  const rig = () => eng.lights!;

  function renderTabs() {
    const r = rig();
    tabs.innerHTML = (Object.keys(NAMES) as GroupId[]).map(g => `<button data-tab="${g}" class="${open.has(g) ? 'on' : ''}">${NAMES[g]}</button>`).join('') +
      `<button data-tab="auto" class="auto ${r?.auto ? 'on' : ''}">AUTO</button><button data-tab="close">✕</button>`;
  }
  tabs.addEventListener('pointerdown', (e) => e.stopPropagation());
  tabs.addEventListener('click', (e) => {
    e.stopPropagation(); const t = (e.target as HTMLElement).closest('button')?.dataset.tab; if (!t) return;
    if (t === 'close') { toggle(false); return; }
    if (t === 'auto') { const r = rig(); r.auto = !r.auto; r.nextAuto = 0; r.eventUntil = 0; renderAll(); return; }
    const g = t as GroupId;
    if (small()) { open.clear(); open.add(g); } else if (open.has(g)) open.delete(g); else open.add(g);
    renderAll();
  });

  function btn(label: string, act: string, on = false, cls = '') { return `<button data-act="${act}" class="${on ? 'on ' : ''}${cls}">${label}</button>`; }
  function body(g: GroupId) {
    const grp = rig().groups[g]; const s: SubState = grp.sel === 'B' ? grp.B : grp.A; const cap = CAP[g];
    let h = '';
    h += `<div class="lsec">Colours and functions</div><div class="lrow sw">` + SWATCHES.map(c => `<button data-act="col:${c}" class="swatch ${!s.rainbow && s.colors.includes(c) ? 'on' : ''}" style="background:${hex(c)}"></button>`).join('') +
      `<button data-act="rainbow" class="swatch rb ${s.rainbow ? 'on' : ''}"></button></div>`;
    h += `<div class="lrow">${btn('+', 'plus', plus)}${btn('A', 'sel:A', grp.sel === 'A')}${btn('B', 'sel:B', grp.sel === 'B')}${btn('ALL', 'sel:ALL', grp.sel === 'ALL')}</div>`;
    h += `<div class="lrow">` + ['SECOND', 'SWITCH', 'SMOOTH', 'GRADIENT', 'FLASH'].map(m => btn(m, 'cmode:' + m, s.colorMode === m && !s.colorCue)).join('') + `</div>`;
    h += `<div class="lrow g6">` + Array.from({ length: 12 }, (_, i) => btn('CUE' + (i + 1), 'ccue:' + (i + 1), s.colorCue === i + 1)).join('') + `</div>`;
    h += `<div class="lsec">Light state</div><div class="lrow">` + ['O', 'X', 'FO', 'FX', 'RAND', 'FRAND', 'ORAND', 'BRAND', 'STROBE', 'FLASH'].map(m => btn(m, 'state:' + m, s.state === m)).join('') + `</div>`;
    h += `<div class="lrow g6">` + Array.from({ length: 12 }, (_, i) => btn('CUE' + (i + 1), 'scue:' + (i + 1), s.stateCue === i + 1)).join('') + `</div>`;
    h += `<div class="lslider"><span>BRIGHTNESS: ${Math.round(s.bright * 100)}%</span><input type="range" min="0" max="100" value="${Math.round(s.bright * 100)}" data-sl="bright"></div>`;
    if (cap.beam) {
      h += `<div class="lsec">Beam controls</div><div class="lrow">${cap.gobo ? btn('GOBO', 'beam:GOBO', s.beam === 'GOBO') : ''}${btn('BEAM', 'beam:BEAM', s.beam === 'BEAM')}${btn('NO BEAM', 'beam:NO BEAM', s.beam === 'NO BEAM')}</div>`;
      h += `<div class="lslider"><span>THICKNESS: ${Math.round(s.thick * 100)}%</span><input type="range" min="10" max="400" value="${Math.round(s.thick * 100)}" data-sl="thick"></div>`;
      if (cap.spread) h += `<div class="lslider"><span>SPREAD: ${Math.round(s.spread * 100)}%</span><input type="range" min="20" max="300" value="${Math.round(s.spread * 100)}" data-sl="spread"></div>`;
    }
    if (cap.pos) {
      const vals = Array.from({ length: 13 }, (_, i) => i * 10);
      h += `<div class="lsec">Positions</div>`;
      h += `<div class="lrow pos">${btn('+/-', 'tneg', s.tiltNeg)}<em>Tilt</em>${vals.map(v => btn(String(v), 'tilt:' + v, s.tilt === v)).join('')}</div>`;
      if (cap.pan) h += `<div class="lrow pos">${btn('+/-', 'pneg', s.panNeg)}<em>Pan</em>${vals.map(v => btn(String(v), 'pan:' + v, s.pan === v)).join('')}</div>`;
      const mv = cap.pan ? ['WIDE', 'IN', 'CROSS', 'U/D'] : ['U/D'];
      h += `<div class="lrow">${mv.map(m => btn(m === 'U/D' && !cap.pan ? 'UP DOWN' : m, 'move:' + m, s.move === m)).join('')}${['FREEZE', 'SSLOW', 'SLOW', 'MEDIUM', 'FAST'].map(m => btn(m, 'msp:' + m, s.mspeed === m)).join('')}</div>`;
      const mv2 = cap.pan ? ['TILT', 'RTILT', 'SMTILT', 'SLTILT', 'PAN', 'RPAN', 'SMPAN', 'SLPAN'] : ['TILT', 'RTILT', 'SMTILT', 'SLTILT'];
      const lab: Record<string, string> = cap.pan ? {} : { RTILT: 'RANDOM TILT', SMTILT: 'SMOOTH TILT', SLTILT: 'SLOW TILT' };
      h += `<div class="lrow">${mv2.map(m => btn(lab[m] || m, 'move:' + m, s.move === m)).join('')}</div>`;
      if (cap.pan) h += `<div class="lrow">${btn('CIRCLE', 'move:CIRCLE', s.move === 'CIRCLE')}${btn('RANDOM CIRCLE', 'move:RANDOM CIRCLE', s.move === 'RANDOM CIRCLE')}${btn('PÚBLICO', 'move:PÚBLICO', s.move === 'PÚBLICO')}${cap.gobo ? btn('GOBO ROTATE', 'gobor', s.goboRot) : ''}</div>`;
      if (cap.follow) h += `<div class="lrow">${btn('Follow player/point…', 'follow', s.follow, 'wide')}${btn('CANCEL', 'cancel')}</div>`;
    }
    h += `<div class="lsec">Modifiers</div>`;
    h += `<div class="lrow mod"><em>Cue speed</em>${SPEEDS.map(v => btn(String(v).replace(/^0/, ''), 'cs:' + v, s.cueSpeed === v)).join('')}</div>`;
    h += `<div class="lrow mod"><em>Fade speed</em>${FADES.map(v => btn(String(v).replace(/^0/, ''), 'fs:' + v, s.fadeSpeed === v)).join('')}</div>`;
    h += `<div class="lrow"><em>Other</em>${btn('LOOP CUES', 'loop', s.loop)}${btn('GROUP RANDOM', 'grnd', s.groupRandom)}${btn('OVERSHOOT', 'over', s.overshoot)}${btn('RESET', 'reset')}</div>`;
    return h;
  }
  function act(g: GroupId, a: string) {
    const r = rig(); const [k, v] = a.split(/:(.*)/s);
    if (k === 'sel') { r.groups[g].sel = v as any; renderAll(); return; }
    if (k === 'plus') { plus = !plus; renderAll(); return; }
    if (k === 'reset') { r.reset(g); r.auto = false; renderAll(); return; }
    r.set(g, (s) => {
      switch (k) {
        case 'col': { const c = +v; s.rainbow = false; s.colorCue = 0; if (plus) { s.colors = s.colors.includes(c) ? s.colors.filter(x => x !== c) : [...s.colors, c]; if (!s.colors.length) s.colors = [c]; } else s.colors = [c]; break; }
        case 'rainbow': s.rainbow = !s.rainbow; s.colorCue = 0; break;
        case 'cmode': s.colorMode = s.colorMode === v ? '' : v as any; s.colorCue = 0; break;
        case 'ccue': s.colorCue = s.colorCue === +v ? 0 : +v; break;
        case 'state': s.state = v as any; s.stateCue = 0; break;
        case 'scue': s.stateCue = s.stateCue === +v ? 0 : +v; break;
        case 'beam': s.beam = v as any; if (v === 'GOBO') s.goboRot = s.goboRot; break;
        case 'tneg': s.tiltNeg = !s.tiltNeg; break;
        case 'pneg': s.panNeg = !s.panNeg; break;
        case 'tilt': s.tilt = +v; s.follow = false; break;
        case 'pan': s.pan = +v; s.follow = false; break;
        case 'move': s.move = s.move === v ? '' : v; s.follow = false; break;
        case 'msp': s.mspeed = v as any; break;
        case 'gobor': s.goboRot = !s.goboRot; if (s.goboRot && s.beam !== 'GOBO') s.beam = 'GOBO'; break;
        case 'follow': s.follow = true; r.pointAt = null; break;
        case 'cancel': s.follow = false; break;
        case 'cs': s.cueSpeed = +v; break;
        case 'fs': s.fadeSpeed = +v; break;
        case 'loop': s.loop = !s.loop; break;
        case 'grnd': s.groupRandom = !s.groupRandom; break;
        case 'over': s.overshoot = !s.overshoot; break;
      }
    });
    renderAll();
  }
  function mkPanel(g: GroupId, i: number) {
    const p = document.createElement('div'); p.className = 'lpanel ui'; p.dataset.g = g;
    p.style.left = (small() ? 6 : 10 + i * 350) + 'px'; p.style.top = '52px';
    p.innerHTML = `<div class="ltitle"><b>${NAMES[g]}</b><span class="badge">LUCES</span><button class="lmin" title="Plegar">▾</button></div><div class="lbody"></div>`;
    root.appendChild(p);
    ['pointerdown', 'touchstart', 'wheel'].forEach(t => p.addEventListener(t, (e) => e.stopPropagation(), { passive: true } as any));
    p.addEventListener('click', (e) => {
      e.stopPropagation(); const b = (e.target as HTMLElement).closest('button'); if (!b) return;
      if (b.classList.contains('lmin')) { p.classList.toggle('min'); return; }
      const a = b.dataset.act; if (a) act(g, a);
    });
    p.addEventListener('input', (e) => {
      const el = e.target as HTMLInputElement; const k = el.dataset.sl; if (!k) return;
      rig().set(g, (s) => { (s as any)[k] = +el.value / 100; }); (el.previousElementSibling as HTMLElement).textContent = `${k === 'bright' ? 'BRIGHTNESS' : k === 'thick' ? 'THICKNESS' : 'SPREAD'}: ${el.value}%`;
      renderTabs();
    });
    // arrastrar por la barra de título
    const title = p.querySelector('.ltitle') as HTMLElement; let drag: { id: number; dx: number; dy: number } | null = null;
    title.addEventListener('pointerdown', (e) => { if ((e.target as HTMLElement).closest('button')) return; drag = { id: e.pointerId, dx: e.clientX - p.offsetLeft, dy: e.clientY - p.offsetTop }; title.setPointerCapture(e.pointerId); });
    title.addEventListener('pointermove', (e) => { if (!drag || e.pointerId !== drag.id) return; p.style.left = Math.max(-200, Math.min(innerWidth - 60, e.clientX - drag.dx)) + 'px'; p.style.top = Math.max(0, Math.min(innerHeight - 30, e.clientY - drag.dy)) + 'px'; });
    title.addEventListener('pointerup', () => { drag = null; });
    return p;
  }
  function renderAll() {
    if (root.classList.contains('hidden') || !eng.lights) return;
    renderTabs();
    (Object.keys(NAMES) as GroupId[]).forEach((g, i) => {
      let p = panels[g];
      if (!open.has(g)) { p?.classList.add('hidden'); return; }
      if (!p) p = panels[g] = mkPanel(g, i);
      p.classList.remove('hidden');
      const sc = p.querySelector('.lbody')!.scrollTop; p.querySelector('.lbody')!.innerHTML = body(g); p.querySelector('.lbody')!.scrollTop = sc;
    });
  }
  function toggle(on?: boolean) {
    const show = on ?? root.classList.contains('hidden');
    root.classList.toggle('hidden', !show); document.getElementById('btnLuces')?.classList.toggle('on', show);
    if (show) renderAll();
  }
  addEventListener('resize', () => {
    if (small() && open.size > 1) { const last = [...open].pop()!; open.clear(); open.add(last); }
    Object.values(panels).forEach(p => { if (p && p.offsetLeft + Math.min(p.offsetWidth, 200) > innerWidth) p.style.left = Math.max(6, innerWidth - p.offsetWidth - 6) + 'px'; });
    renderAll();
  });
  let pend = false;
  const hook = () => { if (eng.lights) eng.lights.onChange = () => { if (!pend) { pend = true; requestAnimationFrame(() => { pend = false; renderAll(); }); } }; };
  hook(); eng.onLights = () => { hook(); renderAll(); };
  return { toggle, renderAll, root };
}
