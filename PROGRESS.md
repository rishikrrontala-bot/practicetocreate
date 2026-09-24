# PROGRESS: Practice to Create entry

**Deadline:** Fri Sep 25, 2026 · 12:45 PM EDT (`2026-09-25T12:45:00-04:00`)
**Internal finish line:** Fri Sep 25, 2026 · 06:45 AM EDT: every deliverable done and pushed (the window is under 2 days, so the rule is ≥6 h of buffer).

## Countdown log
| Phase start (ET) | Hours to deadline |
|---|---|
| Wed Sep 23 · 10:28 PM EDT (session start) | 38.3 h |
| Wed Sep 23 · 11:03 PM EDT (paused at Rishik's request) | 37.7 h |
| Thu Sep 24 · 03:08 PM EDT (resumed: DEVPOST.md) | 21.6 h |

## Phase plan (budgeted backwards from the 06:45 AM Fri internal finish line, ≈32 h of work time)
| # | Phase | Budget | Window (ET) | Status |
|---|---|---|---|---|
| 0 | Countdown, tool check, PROGRESS.md | 0.25 h | Wed 22:28 to 22:45 | done |
| 1–2 | Research: verify event facts, winners, brief (one compressed pass, <48 h left) | 0.75 h | Wed 22:45 to 23:30 | done |
| 3 | Concepts ×3 scored, pick, CONCEPT.md pushed | 0.5 h | Wed 23:30 to Thu 00:00 | done (Low Sun, 4.75) |
| 4 | Design direction: PRODUCT.md + DESIGN.md | 0.5 h | Thu 00:00 to 00:30 | done (cyanotype sun-print) |
| 5 | Core build: the wow moment, then the demo path, then the rest (~50%) | 13 h | Thu 00:30 to 13:30 | **in progress**: app works end to end locally |
| 6 | Quality passes: critique → audit → polish, tests, live check | 2.5 h | Thu 13:30 to 16:00 | |
| 7 | Demo video 3:00–5:00, captioned (~20%) | 5 h | Thu 16:00 to 21:00 | |
| 8 | Submission kit: docs, DEVPOST.md, deck.pdf, gallery, SOURCES-AND-AI (~15%) | 4.5 h | Thu 21:00 to Fri 01:30 | |
| 9 | Ship: merge to main, verify live, HANDOFF.md | 0.75 h | Fri 01:30 to 02:15 | |
| — | Buffer for what breaks (~15%) | 4.5 h | Fri 02:15 to 06:45 | |

## Environment facts (checked at session start)
- Node v22.22.2, npm 10.9.7, Python 3.11.
- Playwright Chromium: `/opt/pw-browsers/chromium-1194` (headless shell present).
- ffmpeg: none from the system and apt install failed, so `pip install imageio-ffmpeg` provided ffmpeg 7.0.2 with libx264/aac/libvpx, symlinked to `/usr/local/bin/ffmpeg`.
- n8n: `N8N_BASE_URL` is **unset**, so there's no API access. Any workflow ships as an importable `n8n/*.json` file plus a HANDOFF step.
- **Network is restricted (not "Full")**. Reachable: registry.npmjs.org, pypi.org, api.github.com (repo-scoped), fonts.googleapis.com / fonts.gstatic.com, storage.googleapis.com, media.githubusercontent.com. **Blocked** by the egress policy for both curl and WebFetch: devpost.com and *.devpost.com, rishikrrontala-bot.github.io, huggingface.co, cdn.jsdelivr.net, unpkg.com, wikipedia.org, youtube.com, web.archive.org, cdnjs. WebSearch (server-side) works.
  - Consequence 1: the Devpost overview/rules pages can't be re-opened from this VM, so event facts are cross-checked through WebSearch summaries of the page and its mirror.
  - Consequence 2: winner pages can't be opened directly. Briefs record exactly what was verified and how.
  - Consequence 3: the live Pages URL can't be loaded from here. The deploy is verified through the GitHub API (Actions run + Pages build status), and the built `dist/` is exercised by Playwright locally with the same base path.
- Design skills: `ui-demo`, `dataviz`, `make-interfaces-feel-better` are loaded. `impeccable`, `emil-design-skills:animate`, taste-skill and `hypersite` are **not** loaded, so they were cloned from their public repos per the CLAUDE.md fallbacks (`/tmp/skills/{impeccable,emil-skills,taste-skill}`); hypersite has no public source, so the `3d-motion-site`/`web-design-cheatcode` skills stand in.
- Sibling concepts: `scripts/siblings.sh` reports **no concept claimed yet** in any of the 14 sibling repos.

## Log
- **Wed 22:28 EDT**: session start, countdown, tool check, PROGRESS.md created.
- **Wed 22:37 EDT (38.1 h left)**: research done (5 search-verified winner briefs, RESEARCH-BRIEF.md). The event is first-edition and mainly an ideathon, so a working product is the differentiator. HACKATHON.md updated with 4 new rules (mention existing solutions; AI honesty; video must show issue/solution/implementation; ideathon). Concept picked: **Low Sun**, the glare calendar for your commute (4.75 vs 3.75 vs 3.75). CONCEPT.md pushed.
- **Wed 23:03 EDT (37.7 h left): PAUSED at Rishik's request ("push everything and stop" at 11:06 PM).** Everything is committed and pushed.

## Where things stand (for the resumed session)
**Working, and pushed:**
- Engine (`src/engine/`): solar.ts (NOAA/Meeus, within 0.003° of NREL SPA), time.ts (Intl-based zones and DST, ZoneYear fast path), glare.ts (25° zone; levels at 25°/15°/8°; the counted level defaults to 15°), scan.ts (year scan, seasons incl. wrap across New Year, shift planner, summary, sun grid), henge.ts (Hayden method; AMNH 2026 times within a minute on all 4 dates, three to the exact minute (half sun May 28 is 8:13:18 PM vs AMNH 8:14); dates within 1 to 3 days, documented), ics.ts (RFC 5545), export.ts (glare drives → events), geo.ts (bearing, coordinate parsing, declination), state.ts (presets and URL hash), words.ts (all sentences built from numbers).
- Tests: **80 passing** (`npx vitest run`), typecheck clean, `npm run build` OK.
- UI: `index.html`, `src/main.ts`, `src/ui/{plate,view,compass}.ts`, `src/styles/{tokens,main}.css`, `src/compute.ts`, `src/worker.ts`. Local screenshots at 1440 and 375 px: zero console errors, no horizontal scroll.
- The last change (unverified visually): Plate II moved above the slip; photogram car redrawn with finer pillars, visor, mirror and dash.

**Next steps, in order:**
1. Screenshot again (`npx vite preview`, then a Playwright script run from the repo root) and check the redrawn windshield and the new side-column order.
2. Add the CI workflow (`.github/workflows/ci.yml`: typecheck + vitest + build + playwright). Pages already deploys from any branch via `pages.yml`; verify the Actions run through the GitHub MCP tools (github.io is blocked from this VM).
3. Playwright e2e on the demo path (`e2e/`): load → verdict + plates render; scrub by keyboard; change preset; ICS download; share link; 375 px layout; no console errors.
4. Impeccable critique → audit → polish (`/tmp/skills/impeccable`, re-clone per the CLAUDE.md fallbacks), then `impeccable detect --json`.
5. Docs: README (hero, live link, Mermaid), docs/ARCHITECTURE.md, docs/LIMITATIONS.md, docs/EXPLAIN-IT.md, LICENSE (MIT).
6. Demo video 3:00–5:00 (ui-demo skill + ffmpeg at `/usr/local/bin/ffmpeg`, from `pip install imageio-ffmpeg`), captions burned in; submission/VIDEO-SCRIPT.md.
7. Submission kit: ~~submission/DEVPOST.md~~ (done Thu 15:15), SOURCES-AND-AI.md (DEVPOST.md already points to it), deck.pdf (8–10 slides), gallery PNGs (≥5 at 1500×1000 + thumbnail), CHECKLIST.md.
8. Merge to main, verify the deploy through the API, write HANDOFF.md.
- **Thu 15:15 EDT (21.5 h left)**: resumed at Rishik's request to write `submission/DEVPOST.md`. Every number in it was re-derived from the code (sources table at the bottom of the file). Verified through the GitHub API that the Pages deploy of the latest commit **succeeded** (run 9). The earlier failed runs came before index.html existed.
