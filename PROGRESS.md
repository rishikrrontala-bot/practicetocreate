# PROGRESS: Practice to Create entry

**Deadline:** Fri Sep 25, 2026 · 12:45 PM EDT (`2026-09-25T12:45:00-04:00`)
**Internal finish line:** Fri Sep 25, 2026 · 06:45 AM EDT: every deliverable done and pushed (the window is under 2 days, so the rule is ≥6 h of buffer).

## Countdown log
| Phase start (ET) | Hours to deadline |
|---|---|
| Wed Sep 23 · 10:28 PM EDT (session start) | 38.3 h |

## Phase plan (budgeted backwards from the 06:45 AM Fri internal finish line, ≈32 h of work time)
| # | Phase | Budget | Window (ET) | Status |
|---|---|---|---|---|
| 0 | Countdown, tool check, PROGRESS.md | 0.25 h | Wed 22:28 to 22:45 | done |
| 1–2 | Research: verify event facts, winners, brief (one compressed pass, <48 h left) | 0.75 h | Wed 22:45 to 23:30 | in progress |
| 3 | Concepts ×3 scored, pick, CONCEPT.md pushed | 0.5 h | Wed 23:30 to Thu 00:00 | |
| 4 | Design direction: PRODUCT.md + DESIGN.md | 0.5 h | Thu 00:00 to 00:30 | |
| 5 | Core build: the wow moment, then the demo path, then the rest (~50%) | 13 h | Thu 00:30 to 13:30 | |
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
