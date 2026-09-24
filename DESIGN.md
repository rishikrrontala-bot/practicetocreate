# DESIGN: Low Sun

*Direction set Wed Sep 23 2026 at the start of the build (impeccable new-work, degraded roll, seed 720bc8f1, assigned candidate 7 of 7: cyanotype sun-print). This file is rewritten from the built world at finish; the tokens below are the ones in `src/styles/tokens.css`.*

## The idea in one line
**The sun is the printer.** Your year of driving is shown as a cyanotype: Prussian-blue paper on which only the minutes a low sun sits in your eyes burn through to white.

Why cyanotype: a cyanotype is literally an image made by sunlight (Herschel 1842; Anna Atkins's *Photographs of British Algae*, 1843, the first photographically illustrated book), and the blueprint is the same chemistry. Glare is sunlight writing on your day, so the medium *is* the message, and it is a world that no dashboard, map app or weather card lives in.

## Scene → theme
A driver planning next week's drives in the evening, at home, on a phone or laptop under indoor light. A deep, saturated ground is comfortable at night and makes the white glare burns the brightest things on screen, which is exactly what they should be. **Dark, drenched, one colour family.** There is no light theme: the print is the product. Contrast is checked (below).

## Colour tokens
| Token | Hex | Use |
|---|---|---|
| `--night` | `#0A2150` | deepest field: night hours on the plate, page edges |
| `--ground` | `#102E6B` | page ground (the exposed paper) |
| `--wash` | `#1A4290` | daylight hours on the plate, raised surfaces |
| `--line` | `#F3EFE4` @ 18–28% | hairlines, axes |
| `--paper` | `#F3EFE4` | type, slips, photogram silhouettes (unexposed paper) |
| `--paper-dim` | `#C9D3EA` | secondary text on blue (tinted from the hue, never grey) |
| `--burn` | `#FFFFFF` | glare marks (the burn-through) |
| `--sun` | `#FFB547` | the sun itself and the "now" marker: the only warm colour |
| `--ink` | `#0A2150` | type on paper slips |

Contrast (WCAG 2.2): paper on ground 11.9:1 · paper-dim on ground 8.9:1 · ink on paper 14.6:1 · sun on ground 8.4:1 · sun on night 10.0:1. Glare severity is never colour-only: burns are also shaded by a stepped density ramp (the step wedge) and exposed as text in the season list and the table.

## Type
| Role | Face | Why |
|---|---|---|
| Display, plate titles | **IM Fell French Canon** (Igino Marini's digitisation of the 17th-century Fell types) | Letterpress captions, like the title pages and plate labels of 19th-century scientific books printed alongside early photographs. Used only ≥ 28 px, where its ink-spread texture reads as print rather than noise. |
| UI and body | **Atkinson Hyperlegible Next** (Braille Institute) | Designed for low-vision legibility, which suits a product about not being able to see. |
| Numbers, data, times | **Atkinson Hyperlegible Mono** | Tabular numerals for dates, minutes and degrees: measurement, not costume. |

Scale (1.25 minor third, fluid): 13 · 15 · 17 · 21 · 26 · 33 · 41 · 52 · 72 · 96 (display cap). Tracking: display −0.01em, mono labels +0.04em. Body measure 62–70ch.

## Material and components
- **Coated field:** every plate sits in a coated area whose edge is ragged like a brushed emulsion, drawn with an SVG turbulence displacement filter (procedural, no raster). No card boxes, no drop shadows, no border radius above 2px.
- **Plate captions:** "Plate I. The year, exposed." in IM Fell italic-free roman, plus a mono sub-caption with the parameters (lat/lon, heading, times).
- **Exposure slip (controls):** a paper-coloured slip (ink on paper) holding the inputs; inputs are ruled lines, not boxes; focus is a 2px sun-amber underline plus an outline ring.
- **Step wedge:** the severity legend and the threshold sliders are drawn as the stepped density strips photographers use to calibrate exposure.
- **Photogram:** the windshield view is a silhouette composition (A-pillars, visor, dash, road edges) in paper white on blue; the sun is a disc with halation drawn at its true angular position.
- **Compass:** an engraved rose (hairline ticks every 5°, labels every 45°), draggable and keyboard-operable.

## Motion
One authored moment: **develop.** When a plate's data changes it "develops": the field fades from pale sensitised paper to Prussian blue over 900 ms (ease-out-quart), and the burns resolve from soft to sharp over 600 ms, staggered by month (20 ms). Scrubbing is instant (no easing on data-driven motion). Everything else is still. With `prefers-reduced-motion: reduce`, develop becomes a 120 ms cross-fade.

## Layout
- Desktop ≥ 1100 px: a two-column grid, 7fr (Plate I and the verdict) and 4fr (the slip and Plate II), with a 32 px gutter and 48 px page margins.
- Tablet 700–1099 px: a single column with Plate I full-width and the slip and Plate II side by side.
- Phone ≤ 699 px: a single column, 16 px gutters; Plate I scrolls horizontally inside its own frame at a readable density with a visible scroll hint, and the page itself never scrolls sideways.

## Bans (from CLAUDE.md and the impeccable craft floor)
No purple/blue *gradients* (the blue here is flat), no cards-as-structure, no eyebrow kickers, no gradient text, no glass, no emoji icons, no hard offset shadows, no stock illustration.
