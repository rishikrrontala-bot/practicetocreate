/**
 * An engraved compass rose for setting a road's direction. Drag the needle, or
 * focus it and use the arrow keys (Shift for 10° steps). The amber arcs on the
 * ring mark where the sun rises and sets over the year at this place, so you
 * can see at a glance whether a road points into them.
 */

import { compassWord } from '../engine/glare';
import { mod } from '../engine/solar';

const NS = 'http://www.w3.org/2000/svg';

function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

const S = 148;
const C = S / 2;
const R = 60;

function polar(deg: number, r: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}

function arc(from: number, to: number, r: number): string {
  const [x1, y1] = polar(from, r);
  const [x2, y2] = polar(to, r);
  const sweep = mod(to - from, 360);
  return `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x2.toFixed(2)},${y2.toFixed(2)}`;
}

export class Compass {
  private readonly slider: SVGGElement;
  private readonly needle: SVGGElement;
  private readonly cone: SVGPathElement;
  private readonly sunArcs: SVGGElement;
  private value = 0;
  private dragging = false;
  onChange: (heading: number) => void = () => {};

  constructor(host: HTMLElement, label: string) {
    const svg = el('svg', { viewBox: `0 0 ${S} ${S}` });
    this.slider = el('g', {
      role: 'slider',
      tabindex: 0,
      'aria-label': label,
      'aria-valuemin': 0,
      'aria-valuemax': 359,
    });
    this.slider.append(el('circle', { cx: C, cy: C, r: C - 2, fill: 'transparent' }));
    this.slider.append(el('circle', { class: 'compass__ring', cx: C, cy: C, r: R, fill: 'none', stroke: '#0a2150', 'stroke-width': 1.5 }));
    this.sunArcs = el('g');
    this.slider.append(this.sunArcs);
    for (let d = 0; d < 360; d += 5) {
      const major = d % 45 === 0;
      const [x1, y1] = polar(d, R);
      const [x2, y2] = polar(d, R - (major ? 9 : d % 15 === 0 ? 5 : 3));
      this.slider.append(el('line', { x1, y1, x2, y2, stroke: '#0a2150', 'stroke-width': major ? 1.5 : 0.8 }));
    }
    for (const [d, t] of [[0, 'N'], [90, 'E'], [180, 'S'], [270, 'W']] as const) {
      const [x, y] = polar(d, R + 10);
      const text = el('text', { x, y: y + 4, 'text-anchor': 'middle', 'font-family': 'var(--font-mono)', 'font-size': 11, fill: '#0a2150', 'font-weight': 700 });
      text.textContent = t;
      this.slider.append(text);
    }
    this.cone = el('path', { fill: 'rgba(255,181,71,0.35)', stroke: 'none' });
    this.slider.append(this.cone);
    this.needle = el('g');
    this.needle.append(
      el('line', { x1: C, y1: C, x2: C, y2: C - R + 12, stroke: '#0a2150', 'stroke-width': 2.5, 'stroke-linecap': 'round' }),
      el('path', { d: `M${C - 7},${C - R + 20} L${C},${C - R + 6} L${C + 7},${C - R + 20} Z`, fill: '#0a2150' }),
      el('circle', { cx: C, cy: C, r: 4.5, fill: '#f3efe4', stroke: '#0a2150', 'stroke-width': 2 }),
    );
    this.slider.append(this.needle);
    svg.append(this.slider);
    host.replaceChildren(svg);
    this.bind(svg);
  }

  set(heading: number): void {
    this.value = mod(heading, 360);
    this.needle.setAttribute('transform', `rotate(${this.value} ${C} ${C})`);
    this.cone.setAttribute('d', `M${C},${C} L${polar(this.value - 25, R - 1).join(',')} ${arc(this.value - 25, this.value + 25, R - 1).replace(/^M[^A]+/, '')} Z`);
    const v = Math.round(this.value * 10) / 10;
    this.slider.setAttribute('aria-valuenow', String(v));
    this.slider.setAttribute('aria-valuetext', `${v} degrees, ${compassWord(this.value)}`);
  }

  /** Mark the year's range of sunrise and sunset directions on the ring. */
  setSunArcs(sunrise: [number, number] | null, sunset: [number, number] | null): void {
    this.sunArcs.replaceChildren();
    for (const range of [sunrise, sunset]) {
      if (!range) continue;
      this.sunArcs.append(el('path', { d: arc(range[0], range[1], R + 1), fill: 'none', stroke: '#e08a00', 'stroke-width': 5, opacity: 0.9 }));
    }
  }

  private commit(heading: number): void {
    this.set(heading);
    this.onChange(this.value);
  }

  private bind(svg: SVGSVGElement): void {
    const fromEvent = (e: PointerEvent) => {
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      return mod((Math.atan2(y, x) * 180) / Math.PI + 90, 360);
    };
    svg.addEventListener('pointerdown', (e) => {
      this.dragging = true;
      svg.setPointerCapture(e.pointerId);
      (this.slider as unknown as HTMLElement).focus({ preventScroll: true });
      this.commit(Math.round(fromEvent(e)));
    });
    svg.addEventListener('pointermove', (e) => {
      if (this.dragging) this.commit(Math.round(fromEvent(e)));
    });
    const end = () => (this.dragging = false);
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    this.slider.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 10 : 1;
      let v = this.value;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v += step;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v -= step;
      else if (e.key === 'PageUp') v += 45;
      else if (e.key === 'PageDown') v -= 45;
      else if (e.key === 'Home') v = 0;
      else return;
      e.preventDefault();
      this.commit(Math.round(v));
    });
  }
}
