# CLAUDE.md: Rishik Rontala's entry for Practice to Create [Feedback To All Projects!]

You are running **unattended in a Claude Code cloud session** to take this hackathon from zero to a submission-ready, deployed, documented and tested entry. Rishik is not available to answer questions. Everything you need is in this repo:

| File | What it is |
|---|---|
| `HACKATHON.md` | Verified event facts: deadline, rules, rubric, required deliverables, strategy notes, sibling entries. **This is the spec.** Re-verify anything marked ⚠ against the live page. |
| `.claude/skills/hackathon-win/` | Rishik's own hackathon process (`SKILL.md` + `references/` + `templates/`). Follow it, with the override below. |
| `PROMPT.md` | The kickoff instructions. |
| `PROGRESS.md` | Your running log. Create it on the first run and update + push it after every phase, so a resumed session continues exactly where you stopped. |
| `scripts/siblings.sh` | Prints the concepts Rishik's other entries have already claimed, so you don't overlap. |

**Deadline: Fri Sep 25, 2026 · 12:45 PM EDT.** Event page: https://practicetocreate.devpost.com/

## Who this is for
Rishik Rontala is a US high-school student who **competes solo** (never invent teammates). GitHub: `rishikrrontala-bot`. His goal is explicit: **place**, not just ship ("we have to win every hackathon"). His bar for the work: the finished product, complete, tested, documented and deployed; "holy shit, that's done", not "good enough". Never offer to table something for later when the real fix is within reach. Never leave a dangling thread. Never present a workaround when the real fix exists.

## Override to the hackathon-win skill
The skill has Rishik pick the concept. In this cloud run he has delegated that to you: score **three distinct concepts** against the weighted rubric, **choose the highest-scoring one yourself**, record all three with their scores and reasoning in `research/CONCEPTS.md`, and keep going. Do winner research inline with batched parallel WebSearch/WebFetch calls. Run **at most 2 subagents at a time**: cloud sessions share Rishik's rate limit with his other entries.

## Lessons from Rishik's past hackathons (non-negotiable)
1. **Habitat Pulse** shipped 44 tests, live data, a clean deploy and honest docs, and did **not place**. It had no demo video and no winner research. So: research real past winners before scoping, and treat the demo video as a first-class deliverable.
2. **Earshot** was finished, deployed and documented, and **never submitted**: the deadline passed during optional polish. So: run `TZ=America/New_York date` at the start of every phase and write the hours left into PROGRESS.md. Finish all deliverables ≥24 h before the deadline (≥6 h when the whole window is under two days). A reviewer's non-blocking findings stay non-blocking.
3. **Never fabricate** winners, users, testimonials, interviews, metrics, traction, datasets or citations. Open every winner you cite (link it in the brief). Every number in the README must be reproducible from this repo.
4. Credibility comes from documented restraint: `docs/LIMITATIONS.md` states plainly what the tool can't do. No fake precision. Health tools never claim to diagnose; legal tools never claim to give legal advice.
5. **Hookline lesson:** for any text generator, read real outputs and verify them. Never emit template phrases or words the source didn't say.
6. **R3F/WebGL lesson:** the first frame must be correct without `useFrame` (set the camera in `useLayoutEffect`, dispatch a `resize` on mount and on `visibilitychange`). A canvas stuck at 300×150 means R3F never initialised. Never gate the frameloop on an IntersectionObserver.
7. Any app that makes sound starts muted (`?mute=1`) during automated testing; verify audio by measuring signal (AnalyserNode peak/RMS), not by playing it.

## Engineering defaults
- **Static-first. No required backend, no required API key.** A cold judge visit must never fail for lack of a key. If AI is core, prefer on-device inference (Transformers.js, WebLLM, MediaPipe, ONNX Runtime Web, TF.js) or real deterministic algorithms. When a hosted model or a secret-bearing integration genuinely adds value, put it behind **Rishik's n8n** (next section), never in the browser bundle. Never commit secrets.
- Vite + TypeScript unless the concept genuinely needs something else. Domain logic lives in pure functions with **Vitest** unit tests. **Playwright** e2e covers the judge's demo path. A CI workflow runs typecheck + tests + build on every push.
- `base: './'` (relative asset paths) so the site keeps working if the repo is renamed.
- Fast first load (LCP < 2.5 s on 4G), zero console errors, works at 375 px wide, works logged-out in a fresh browser.
- WCAG 2.2 AA: contrast, keyboard paths, visible focus, `prefers-reduced-motion`, semantic HTML, alt text.

## n8n: the server side for a static site
Rishik has **n8n Pro** (cloud). Use it when a feature needs a secret, a schedule or an integration that a static GitHub Pages site can't hold: a hosted LLM call with his key, a nightly data refresh, email/SMS/Slack notifications, a form → spreadsheet pipeline, a scheduled scrape of an open dataset. Don't reach for it when on-device or deterministic code does the job; it is a means, not a feature.
- **Check access first:** `echo "$N8N_BASE_URL"` and `curl -s -o /dev/null -w '%{http_code}' "$N8N_BASE_URL/api/v1/workflows?limit=1"`. A `200` means the environment's API credential is attached (the proxy adds the `X-N8N-API-KEY` header; you never see the key). Anything else means no API access, so ship the workflow as an importable file instead.
- **Build workflows as code:** commit every workflow as `n8n/<name>.json` (valid n8n export JSON, named `[practicetocreate] <purpose>`, tagged `hackathon`). With API access, create it with `POST $N8N_BASE_URL/api/v1/workflows`, activate it with `POST …/workflows/<id>/activate`, and exercise the production webhook with `curl` before wiring it into the site.
- **Credentials:** never create, print or commit secrets. To reuse one of Rishik's existing n8n credentials (e.g. an LLM key), read its `{id, name}` from the `credentials` block of an existing workflow (`GET /api/v1/workflows`). If none fits, leave the node's credential empty and make "attach credential X to workflow Y" a HANDOFF.md step.
- **Webhooks called from the site must be hardened:** restrict *Allowed Origins (CORS)* to `https://rishikrrontala-bot.github.io`, validate and length-cap every input, and enforce a daily call cap with workflow static data (`$getWorkflowStaticData('global')`), because public endpoints get abused. Return JSON with explicit error shapes.
- **Degrade gracefully:** the site reads the webhook URL from config and must still deliver its core demo when the webhook is unset, down or rate-limited (on-device fallback or clearly labelled sample output). Test both paths in Playwright by mocking the webhook route.
- Document every workflow in `docs/ARCHITECTURE.md` (a trigger → nodes → output diagram) and credit n8n in Built With.

## Design & motion standard
Rishik's bar is award-level studio work. The failure mode he names is "looks AI-generated". The design skills load from his claude.ai account:
- **`impeccable`** (`/impeccable`): shape the direction first (writes `PRODUCT.md` + `DESIGN.md`), build, then run `critique` → `audit` → `polish` passes and fix every material finding before shipping.
- **`emil-design-skills:animate`**: decide every animation in order (should it animate at all → purpose → tool → properties → curve and duration → interruption → exit). Also `emil-design-eng` and `make-interfaces-feel-better` for the invisible details.
- **taste-skill** (`design-taste-frontend`, `high-end-visual-design`, and `minimalist-ui` / `industrial-brutalist-ui` when they fit), **`hypersite`** for marketing/landing surfaces, **`dataviz`** before any chart, **`ui-demo`** for the demo video.
- If any of these is missing in this session, see *Fallbacks* below.

Taste references: Rishik's portfolio (github.com/rishikrrontala-bot/portfolio: Archivo 800 condensed uppercase display, JetBrains Mono micro-labels, bone `#F4F1EA` / ink `#100F0D` / terra `#DA532C`, grain, custom cursor, Lenis + GSAP) and Unseen Studio (unseen.co: a high-contrast display serif at weight 400, a neo-grotesk body, warm blush/bone ground, tiny wide-tracked mono labels, hairline rules, big negative space). His rule: "that style, but don't just copy them." Free stand-ins that hold up: Instrument Serif, General Sans / Switzer / Inter Tight, JetBrains Mono.

**This entry gets its own art direction, derived from its concept.** Rishik is entering 15 events at once, so no two entries may share a template. Banned: purple/blue gradients, centered-card SaaS templates, emoji section headers, Playfair + drop shadows, generic 3D blobs, stock hero illustrations.

Credit, always: a visible "Built by Rishik Rontala" (footer or about section) plus `<meta name="author" content="Rishik Rontala">`, styled to match the site.

## Git & deployment
- The SessionStart hook sets the commit identity to `Rishik Rontala <297979650+rishikrrontala-bot@users.noreply.github.com>`. Never author commits as Claude; a `Co-Authored-By: Claude <noreply@anthropic.com>` trailer is fine.
- Commit small and often. **Push after every phase.** The VM is ephemeral, so anything not pushed is lost.
- Commit the deliverables too: the video (keep it < 50 MB, H.264, CRF ~26), gallery PNGs and PDFs. Rishik downloads them from GitHub.
- **GitHub Pages deploys automatically from whatever branch you push** (`.github/workflows/pages.yml` builds `dist/`, `build/`, `out/` or `site/`, or a root `index.html`). Live URL: **https://rishikrrontala-bot.github.io/practicetocreate/**. After each deploy, check the Actions run succeeded and load the URL headlessly.
- Finish on `main` (judges read the default branch). Try `git push origin HEAD:main`. If that's refused, open a PR and merge it with the REST API (`gh api -X POST repos/rishikrrontala-bot/practicetocreate/pulls -f title=… -f head=<branch> -f base=main`, then `gh api -X PUT repos/rishikrrontala-bot/practicetocreate/pulls/<n>/merge -f merge_method=squash`). If that's refused too, make "merge the PR" step 1 of HANDOFF.md.

## Cloud environment notes
- The environment should have **Full** network access (needed for Playwright's Chromium, Hugging Face model weights, fonts, datasets). If a download is blocked, try `pip install imageio-ffmpeg` (a bundled ffmpeg from PyPI), `apt-get install -y ffmpeg chromium`, or an existing browser (`which google-chrome chromium chromium-browser`). If something is still blocked, record it in PROGRESS.md and find another route. Never silently skip the video.
- WebSearch/WebFetch work at any network level. Winner hunting: `https://<event>.devpost.com/project-gallery` (winners carry a "Winner" badge), `https://devpost.com/software/<slug>` for each project, `https://devpost.com/hackathons?search=<organizer>` for sibling events.
- CPU-only VM: 4 vCPU, 16 GB RAM, 30 GB disk. Run long jobs in the background with checkpoints and logs.

## Fallbacks
If a design skill isn't listed in this session, clone its public source and read the `SKILL.md` files directly:
```bash
mkdir -p /tmp/skills && cd /tmp/skills
git clone --depth 1 https://github.com/pbakaus/impeccable
git clone --depth 1 https://github.com/emilkowalski/skills emil-skills
git clone --depth 1 https://github.com/leonxlnx/taste-skill
```

## Definition of done
Nothing below is optional unless HACKATHON.md says the event doesn't use it.
```
research/winners/*.md      5–8 verified past-winner briefs (templates/winner-brief.md), each with its URL
research/RESEARCH-BRIEF.md problem shape, demo shape, scope ceiling, what winners skipped, judges, rubric
research/CONCEPTS.md       3 concepts × weighted rubric, the pick, and why
CONCEPT.md                 one-screen summary of the chosen concept (push within the first hour)
PRODUCT.md, DESIGN.md      impeccable context: users, voice, art direction, tokens
src/, tests/, e2e/         the product; unit + e2e tests; CI green
n8n/*.json                 every n8n workflow the product uses (if any), importable, documented
README.md                  judge-facing: hero image, live link, video link, problem → solution → how it works →
                           architecture (Mermaid) → run locally → tests → limitations → AI disclosure → credits
docs/ARCHITECTURE.md       components, data flow, key algorithms, trade-offs
docs/LIMITATIONS.md        plainly what it can't do
docs/EXPLAIN-IT.md         Rishik's defence guide: every part in plain language + 15 likely judge questions with answers
submission/DEVPOST.md      paste-ready: name, tagline (≤200 chars), Inspiration / What it does / How we built it /
                           Challenges / Accomplishments / What we learned / What's next, Built With, links, tracks,
                           truthful AI-use statement
submission/VIDEO-SCRIPT.md timed script, shot list, voiceover lines Rishik can record in his own voice
submission/video/demo.mp4  captioned, 1080p, wow moment in the first 15 s, length per HACKATHON.md
submission/gallery/*.png   ≥5 captioned 1500×1000 images + a thumbnail
submission/CHECKLIST.md    .claude/skills/hackathon-win/templates/submission-checklist.md, filled in honestly
+ every event-specific extra listed in HACKATHON.md
HANDOFF.md                 only the steps that truly need Rishik, in order, with the deadline in ET and hours left
PROGRESS.md                running log
```
AI-use disclosure must be truthful: the project was built with Claude Code (Anthropic) as an AI coding agent, directed by Rishik.
