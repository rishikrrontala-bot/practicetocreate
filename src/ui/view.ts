/**
 * Plate II: the view ahead. A photogram of the driver's seat (the car's
 * pillars, roof, visor and dash in paper white, as objects laid on a sun-print
 * leave white shapes) with the sun placed at its true angle to the road.
 */

import { LEVEL_NAMES, glareReading, type GlareLevel, type GlareLimits } from '../engine/glare';

const NS = 'http://www.w3.org/2000/svg';
const W = 800;
const H = 500;
const HORIZON = 318;
const PX_PER_DEG = W / 96; // ±48° across

function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

export interface ViewInput {
  sunAzimuth: number;
  sunElevation: number;
  heading: number;
  limits: GlareLimits;
}

export class WindshieldView {
  private readonly svg: SVGSVGElement;
  private readonly sky: SVGRectElement;
  private readonly cone: SVGPathElement;
  private readonly sunGroup: SVGGElement;
  private readonly note: SVGTextElement;

  constructor(host: HTMLElement) {
    this.svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'The view through the windshield, with the sun at its true position relative to the road.' });
    const defs = el('defs');
    const halo = el('radialGradient', { id: 'halo' });
    halo.append(
      el('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': 0.95 }),
      el('stop', { offset: '22%', 'stop-color': '#ffe2b0', 'stop-opacity': 0.55 }),
      el('stop', { offset: '100%', 'stop-color': '#ffffff', 'stop-opacity': 0 }),
    );
    defs.append(halo);
    this.svg.append(defs);

    this.sky = el('rect', { x: 0, y: 0, width: W, height: HORIZON, fill: '#1a4290' });
    this.svg.append(this.sky);
    this.svg.append(el('rect', { x: 0, y: HORIZON, width: W, height: H - HORIZON, fill: '#0a2150' }));

    // The glare zone: ±25° across and up to 25° high, centred on the road ahead.
    this.cone = el('path', { fill: 'rgba(243,239,228,0.06)', stroke: 'rgba(243,239,228,0.35)', 'stroke-width': 1, 'stroke-dasharray': '3 4' });
    this.svg.append(this.cone);

    // Road to the vanishing point.
    const vx = W / 2;
    this.svg.append(
      el('path', { d: `M${vx - 330},${H} L${vx - 4},${HORIZON} L${vx + 4},${HORIZON} L${vx + 330},${H} Z`, fill: '#081a42' }),
      el('path', { d: `M${vx - 330},${H} L${vx - 4},${HORIZON}`, stroke: 'rgba(243,239,228,0.55)', 'stroke-width': 1.5, fill: 'none' }),
      el('path', { d: `M${vx + 330},${H} L${vx + 4},${HORIZON}`, stroke: 'rgba(243,239,228,0.55)', 'stroke-width': 1.5, fill: 'none' }),
      el('path', { d: `M${vx},${H} L${vx},${HORIZON}`, stroke: 'rgba(255,181,71,0.75)', 'stroke-width': 2, 'stroke-dasharray': '14 12', fill: 'none' }),
      el('line', { x1: 0, x2: W, y1: HORIZON, y2: HORIZON, stroke: 'rgba(243,239,228,0.5)', 'stroke-width': 1 }),
    );

    this.sunGroup = el('g');
    this.svg.append(this.sunGroup);

    // The car, as a photogram: white where it blocks the light, edges softened
    // like an object laid on sensitised paper.
    const soft = el('filter', { id: 'photogram', x: '-2%', y: '-2%', width: '104%', height: '104%' });
    soft.append(
      el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.6', numOctaves: 2, seed: 3, result: 'n' }),
      el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 3 }),
    );
    defs.append(soft);
    const car = el('g', { fill: '#f3efe4', filter: 'url(#photogram)' });
    car.append(
      // roof header
      el('path', { d: `M0,0 H${W} V20 Q${W / 2},40 0,20 Z` }),
      // A-pillars: the near (driver's) side wider than the far side
      el('path', { d: 'M22,18 L70,26 Q104,210 156,404 L112,414 Q58,214 22,18 Z' }),
      el('path', { d: `M${W - 18},18 L${W - 44},26 Q${W - 84},212 ${W - 128},398 L${W - 102},404 Q${W - 58},214 ${W - 18},18 Z` }),
      // driver's visor, flipped down, with its hinge rod
      el('rect', { x: 86, y: 34, width: 236, height: 54, rx: 9, opacity: 0.96 }),
      el('rect', { x: 96, y: 26, width: 214, height: 10, rx: 4 }),
      // rear-view mirror and stem
      el('rect', { x: W / 2 + 18, y: 50, width: 128, height: 36, rx: 12 }),
      el('rect', { x: W / 2 + 76, y: 30, width: 10, height: 22, rx: 3 }),
      // dash with the instrument hood
      el('path', { d: `M0,${H - 64} C${W * 0.22},${H - 86} ${W * 0.36},${H - 92} ${W / 2 - 120},${H - 94} Q${W / 2},${H - 118} ${W / 2 + 120},${H - 94} C${W * 0.7},${H - 90} ${W * 0.86},${H - 84} ${W},${H - 72} V${H} H0 Z` }),
    );
    // steering wheel rim, a band in front of the driver
    car.append(
      el('path', {
        d: `M${W / 2 - 176},${H} A176,118 0 0 1 ${W / 2 + 176},${H} L${W / 2 + 158},${H} A158,102 0 0 0 ${W / 2 - 158},${H} Z`,
        fill: '#f3efe4',
      }),
    );
    this.svg.append(car);

    this.note = el('text', {
      x: W / 2,
      y: HORIZON - 16,
      'text-anchor': 'middle',
      fill: 'rgba(243,239,228,0.85)',
      'font-family': 'var(--font-mono)',
      'font-size': 17,
    });
    this.svg.append(this.note);
    host.replaceChildren(this.svg);
  }

  update(v: ViewInput): { level: GlareLevel; text: string } {
    const r = glareReading(v.sunAzimuth, v.sunElevation, v.heading, v.limits);
    const x = W / 2 + r.offset * PX_PER_DEG;
    const y = HORIZON - v.sunElevation * PX_PER_DEG;

    // Sky tone follows the sun: night below −6°, dawn to day above.
    const e = v.sunElevation;
    const sky = e < -6 ? '#0e2a63' : e < 0 ? '#153779' : e < 6 ? '#1d4a98' : '#2356a8';
    this.sky.setAttribute('fill', sky);

    const zx = v.limits.maxOffset * PX_PER_DEG;
    const zy = v.limits.maxElevation * PX_PER_DEG;
    this.cone.setAttribute('d', `M${W / 2 - zx},${HORIZON} L${W / 2 - zx},${HORIZON - zy} L${W / 2 + zx},${HORIZON - zy} L${W / 2 + zx},${HORIZON} Z`);

    this.sunGroup.replaceChildren();
    this.note.textContent = '';
    if (e < -0.8) {
      this.note.textContent = 'Sun below the horizon';
      return { level: 0, text: 'The sun is below the horizon.' };
    }
    const inFrame = Math.abs(r.offset) <= 48;
    if (inFrame) {
      const glow = r.level >= 2 ? 150 : r.level === 1 ? 105 : 70;
      this.sunGroup.append(
        el('circle', { cx: x, cy: y, r: glow, fill: 'url(#halo)', opacity: r.level >= 1 ? 1 : 0.55 }),
        el('circle', { cx: x, cy: y, r: 15, fill: '#ffb547' }),
        el('circle', { cx: x, cy: y, r: 9, fill: '#fff4dc' }),
      );
    } else {
      const right = r.offset > 0;
      const ax = right ? W - 30 : 30;
      const ay = Math.max(70, Math.min(HORIZON - 12, y));
      this.sunGroup.append(
        el('path', { d: right ? `M${ax - 16},${ay - 10} L${ax},${ay} L${ax - 16},${ay + 10}` : `M${ax + 16},${ay - 10} L${ax},${ay} L${ax + 16},${ay + 10}`, stroke: '#ffb547', 'stroke-width': 3, fill: 'none' }),
      );
      this.note.textContent = `Sun ${Math.abs(r.offset).toFixed(0)}° to the ${right ? 'right' : 'left'}, out of view`;
    }
    const text =
      r.level === 0
        ? `Clear: sun ${Math.max(0, e).toFixed(0)}° up, ${Math.abs(r.offset).toFixed(0)}° ${r.offset < 0 ? 'left' : 'right'} of the road.`
        : `${LEVEL_NAMES[r.level]}: sun ${Math.max(0, e).toFixed(1)}° up, ${Math.abs(r.offset).toFixed(1)}° ${r.offset < 0 ? 'left' : 'right'} of straight ahead.`;
    return { level: r.level, text };
  }
}
