/**
 * Plate I: the year, exposed. Every day across, every five minutes down,
 * painted onto a canvas like a sun-print, with the commute bands, sunrise and
 * sunset curves and the scrub cursor drawn over it in SVG.
 */

import type { SunGrid } from '../engine/scan';
import type { AppState } from '../engine/state';
import { dateOfDayIndex, formatClock, monthName } from '../engine/time';
import type { Result } from '../compute';

export interface Scrub {
  day: number;
  minute: number;
}

interface Colors {
  night: [number, number, number];
  twilight: [number, number, number];
  wash: [number, number, number];
  wash2: [number, number, number];
  l1: [number, number, number];
  l2: [number, number, number];
  l3: [number, number, number];
}

const C: Colors = {
  night: [10, 33, 80],
  twilight: [19, 49, 110],
  wash: [26, 66, 144],
  wash2: [38, 86, 168],
  l1: [95, 127, 184],
  l2: [185, 200, 230],
  l3: [255, 255, 255],
};

const SVG_NS = 'http://www.w3.org/2000/svg';

function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const e = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

function mix(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Visible minutes of the day: from before the earliest sunrise to after the latest sunset. */
export function visibleRange(grid: SunGrid, state: AppState): [number, number] {
  let lo = 1440;
  let hi = 0;
  for (let d = 0; d < grid.days; d++) {
    if (!Number.isNaN(grid.sunrise[d])) lo = Math.min(lo, grid.sunrise[d]);
    if (!Number.isNaN(grid.sunset[d])) hi = Math.max(hi, grid.sunset[d]);
  }
  if (lo >= hi) return [0, 1440];
  if (state.out.enabled) {
    lo = Math.min(lo, state.out.depart);
    hi = Math.max(hi, state.out.depart + state.out.duration);
  }
  if (state.back.enabled) {
    lo = Math.min(lo, state.back.depart);
    hi = Math.max(hi, state.back.depart + state.back.duration);
  }
  const start = Math.max(0, Math.floor((lo - 60) / 60) * 60);
  const end = Math.min(1440, Math.ceil((hi + 60) / 60) * 60);
  return [start, end];
}

export class YearPlate {
  private readonly field: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly overlay: SVGSVGElement;
  private readonly scrubEl: HTMLElement;
  private result: Result | null = null;
  private state: AppState | null = null;
  private range: [number, number] = [0, 1440];
  private scrub: Scrub = { day: 0, minute: 720 };
  private cursor: SVGGElement | null = null;
  private dragging = false;
  private todayIndex = -1;
  onScrub: (s: Scrub) => void = () => {};

  constructor(field: HTMLElement) {
    this.field = field;
    this.canvas = field.querySelector('canvas')!;
    this.overlay = field.querySelector('svg')!;
    this.scrubEl = field.querySelector('.plate__scrub')!;
    this.bind();
    new ResizeObserver(() => this.draw(false)).observe(field);
  }

  setToday(index: number): void {
    this.todayIndex = index;
  }

  update(result: Result, state: AppState, develop: boolean): void {
    const locationChanged = !this.result || this.result.gridKey !== result.gridKey;
    this.result = result;
    this.state = state;
    this.range = visibleRange(result.grid, state);
    this.draw(develop && locationChanged);
  }

  setScrub(s: Scrub, emit = true): void {
    const r = this.result;
    const days = r ? r.grid.days : 365;
    this.scrub = {
      day: Math.max(0, Math.min(days - 1, Math.round(s.day))),
      minute: Math.max(this.range[0], Math.min(this.range[1] - 1, Math.round(s.minute))),
    };
    this.drawCursor();
    if (emit) this.onScrub(this.scrub);
  }

  getScrub(): Scrub {
    return this.scrub;
  }

  // ------------------------------------------------------------------ drawing

  private draw(develop: boolean): void {
    const r = this.result;
    const s = this.state;
    if (!r || !s) return;
    const w = this.field.clientWidth;
    const h = this.field.clientHeight;
    if (w === 0 || h === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);

    const grid = r.grid;
    const [m0, m1] = this.range;
    const r0 = Math.floor(m0 / grid.step);
    const rows = Math.ceil((m1 - m0) / grid.step);

    // Paint at native resolution (one pixel per day per five minutes)…
    const img = new ImageData(grid.days, rows);
    const glareOnly = new ImageData(grid.days, rows);
    for (let d = 0; d < grid.days; d++) {
      for (let k = 0; k < rows; k++) {
        const i = d * grid.rows + r0 + k;
        const e = grid.elevation[i];
        const lvl = r.glare[i];
        let c: [number, number, number];
        if (lvl === 3) c = C.l3;
        else if (lvl === 2) c = C.l2;
        else if (lvl === 1) c = C.l1;
        else if (e < -6) c = C.night;
        else if (e < 0) c = mix(C.night, C.twilight, (e + 6) / 6);
        else c = mix(C.wash, C.wash2, Math.min(1, e / 60));
        const p = (k * grid.days + d) * 4;
        img.data[p] = c[0];
        img.data[p + 1] = c[1];
        img.data[p + 2] = c[2];
        img.data[p + 3] = 255;
        if (lvl >= 2) {
          glareOnly.data[p] = 255;
          glareOnly.data[p + 1] = 255;
          glareOnly.data[p + 2] = 255;
          glareOnly.data[p + 3] = lvl === 3 ? 255 : 150;
        }
      }
    }
    const src = document.createElement('canvas');
    src.width = grid.days;
    src.height = rows;
    src.getContext('2d')!.putImageData(img, 0, 0);
    const bloom = document.createElement('canvas');
    bloom.width = grid.days;
    bloom.height = rows;
    bloom.getContext('2d')!.putImageData(glareOnly, 0, 0);

    // …then print it onto the plate, softly, with a bloom where the sun burns through.
    const ctx = this.canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, this.canvas.width, this.canvas.height);
    if ('filter' in ctx) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.55;
      ctx.filter = `blur(${Math.round(5 * dpr)}px)`;
      ctx.drawImage(bloom, 0, 0, this.canvas.width, this.canvas.height);
      ctx.restore();
    }

    this.drawOverlay(w, h);
    if (develop) this.develop();
  }

  private develop(): void {
    this.field.classList.remove('is-developing');
    // Restart the CSS animation.
    void this.field.offsetWidth;
    this.field.classList.add('is-developing');
    window.setTimeout(() => this.field.classList.remove('is-developing'), 1400);
  }

  private x(day: number, w: number): number {
    const days = this.result?.grid.days ?? 365;
    return (day / days) * w;
  }

  private y(minute: number, h: number): number {
    const [m0, m1] = this.range;
    return ((minute - m0) / (m1 - m0)) * h;
  }

  private drawOverlay(w: number, h: number): void {
    const r = this.result!;
    const s = this.state!;
    const svg = this.overlay;
    svg.replaceChildren();
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const narrow = w < 560;

    // Month rules and labels.
    const months = el('g', { class: 'months' });
    for (let m = 1; m <= 12; m++) {
      const idx = Math.round((Date.UTC(s.year, m - 1, 1) - Date.UTC(s.year, 0, 1)) / 86_400_000);
      const x = this.x(idx, w);
      if (m > 1) months.append(el('line', { x1: x, x2: x, y1: 0, y2: h, stroke: 'rgba(243,239,228,0.14)', 'stroke-width': 1 }));
      const label = el('text', {
        x: x + (w / 12) / 2,
        y: -8,
        'text-anchor': 'middle',
        fill: 'rgba(201,211,234,0.95)',
        'font-family': 'var(--font-mono)',
        'font-size': narrow ? 10 : 11,
        'letter-spacing': '0.06em',
      });
      label.textContent = narrow ? monthName(m).slice(0, 1) : monthName(m).toUpperCase();
      months.append(label);
    }
    svg.append(months);

    // Hour labels down the left edge, inside the plate.
    const [m0, m1] = this.range;
    const hours = el('g');
    const every = m1 - m0 > 14 * 60 ? 3 : 2;
    for (let m = Math.ceil(m0 / 60) * 60; m < m1; m += 60) {
      const y = this.y(m, h);
      hours.append(el('line', { x1: 0, x2: 6, y1: y, y2: y, stroke: 'rgba(243,239,228,0.5)', 'stroke-width': 1 }));
      if ((m / 60) % every === 0) {
        const t = el('text', {
          x: 9,
          y: y + 4,
          fill: 'rgba(243,239,228,0.78)',
          'font-family': 'var(--font-mono)',
          'font-size': narrow ? 9.5 : 11,
        });
        t.textContent = formatClock(m).replace(':00', '');
        hours.append(t);
      }
    }
    svg.append(hours);

    // Sunrise and sunset curves.
    for (const arr of [r.grid.sunrise, r.grid.sunset]) {
      let d = '';
      for (let i = 0; i < r.grid.days; i++) {
        if (Number.isNaN(arr[i])) continue;
        d += `${d ? 'L' : 'M'}${this.x(i + 0.5, w).toFixed(1)},${this.y(arr[i], h).toFixed(1)}`;
      }
      svg.append(el('path', { d, fill: 'none', stroke: 'rgba(243,239,228,0.35)', 'stroke-width': 1, 'stroke-dasharray': '1 3' }));
    }

    // Commute bands, and the hits: driving days with the sun in your eyes.
    const legs = [
      s.out.enabled ? s.out : null,
      s.back.enabled ? s.back : null,
    ].filter((l): l is NonNullable<typeof l> => l !== null);
    legs.forEach((leg, li) => {
      const y0 = this.y(leg.depart, h);
      const y1 = this.y(leg.depart + leg.duration, h);
      const bh = Math.max(3, y1 - y0);
      svg.append(el('rect', { x: 0, y: y0, width: w, height: bh, fill: 'rgba(243,239,228,0.07)', stroke: 'rgba(243,239,228,0.55)', 'stroke-width': 1, 'stroke-dasharray': '4 3' }));
      const hits = el('g', { fill: 'var(--sun)' });
      const dayW = Math.max(1, w / r.grid.days);
      for (const day of r.scan.days) {
        const l = day.legs[li];
        if (!day.driving || !l || l.glareMinutes === 0) continue;
        const hy0 = this.y(leg.depart + l.first, h);
        const hy1 = this.y(leg.depart + l.last + 1, h);
        hits.append(el('rect', { x: this.x(day.index, w), y: Math.min(hy0, y1 - 2), width: dayW + 0.4, height: Math.max(2, hy1 - hy0) }));
      }
      svg.append(hits);
      const tag = el('text', {
        x: w - 6,
        y: y0 - 5,
        'text-anchor': 'end',
        fill: 'var(--paper)',
        'font-family': 'var(--font-mono)',
        'font-size': narrow ? 9.5 : 11,
      });
      tag.textContent = `${li === 0 && s.out.enabled ? 'MORNING' : 'EVENING'} ${formatClock(leg.depart)}`;
      svg.append(tag);
    });

    // Today.
    if (this.todayIndex >= 0 && this.todayIndex < r.grid.days) {
      const x = this.x(this.todayIndex + 0.5, w);
      svg.append(el('line', { x1: x, x2: x, y1: 0, y2: h, stroke: 'var(--sun)', 'stroke-width': 1, 'stroke-dasharray': '2 3', opacity: 0.8 }));
      const t = el('text', { x: x + 4, y: h - 6, fill: 'var(--sun)', 'font-family': 'var(--font-mono)', 'font-size': narrow ? 9.5 : 11 });
      t.textContent = 'TODAY';
      svg.append(t);
    }

    this.cursor = el('g', { class: 'cursor' });
    svg.append(this.cursor);
    this.drawCursor();
  }

  private drawCursor(): void {
    if (!this.cursor || !this.result) return;
    const w = this.field.clientWidth;
    const h = this.field.clientHeight;
    const x = this.x(this.scrub.day + 0.5, w);
    const y = this.y(this.scrub.minute, h);
    this.cursor.replaceChildren(
      el('line', { x1: x, x2: x, y1: 0, y2: h, stroke: 'var(--paper)', 'stroke-width': 1, opacity: 0.7 }),
      el('line', { x1: 0, x2: w, y1: y, y2: y, stroke: 'var(--paper)', 'stroke-width': 1, opacity: 0.4 }),
      el('circle', { cx: x, cy: y, r: 6, fill: 'none', stroke: 'var(--sun)', 'stroke-width': 2 }),
    );
    const d = dateOfDayIndex(this.state!.year, this.scrub.day);
    this.scrubEl.setAttribute('aria-valuetext', `${monthName(d.month, true)} ${d.day}, ${formatClock(this.scrub.minute)}`);
  }

  // ------------------------------------------------------------------ input

  private fromPointer(e: PointerEvent): Scrub {
    const rect = this.field.getBoundingClientRect();
    const fx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const fy = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const days = this.result?.grid.days ?? 365;
    const [m0, m1] = this.range;
    return { day: Math.floor(fx * days), minute: m0 + fy * (m1 - m0) };
  }

  private bind(): void {
    const el = this.scrubEl;
    el.addEventListener('pointerdown', (e) => {
      this.dragging = true;
      el.setPointerCapture(e.pointerId);
      this.setScrub(this.fromPointer(e));
    });
    el.addEventListener('pointermove', (e) => {
      if (this.dragging || e.pointerType === 'mouse') this.setScrub(this.fromPointer(e));
    });
    const end = () => {
      this.dragging = false;
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('keydown', (e) => {
      const big = e.shiftKey;
      const s = { ...this.scrub };
      switch (e.key) {
        case 'ArrowLeft':
          s.day -= big ? 7 : 1;
          break;
        case 'ArrowRight':
          s.day += big ? 7 : 1;
          break;
        case 'ArrowUp':
          s.minute -= big ? 30 : 5;
          break;
        case 'ArrowDown':
          s.minute += big ? 30 : 5;
          break;
        case 'Home':
          s.day = 0;
          break;
        case 'End':
          s.day = (this.result?.grid.days ?? 365) - 1;
          break;
        default:
          return;
      }
      e.preventDefault();
      this.setScrub(s);
    });
  }
}
