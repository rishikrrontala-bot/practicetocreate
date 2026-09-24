---
name: hackathon-win
description: Research a specific hackathon's past winners before building anything, reverse-engineer its judging rubric, pitch concepts scored against that rubric, then execute the build and the submission as one deliverable. Use whenever Rishik mentions entering, joining, competing in, or building for a hackathon, jam, challenge, or competition — even if he leads with an idea instead of asking for research.
---

# Hackathon Win

The goal is **placing**, not shipping. A technically excellent submission that doesn't win is a loss.

This skill exists because of a real failure: Habitat Pulse (Hack the Habitat 2026) shipped with live data, 44 passing tests, clean architecture, honest docs, full attribution, and a live deploy — and did not place. It had no demo video and no research into what previously won there. The engineering was never the problem. It was aimed at the wrong target.

## The hard rule

**Do not write feature code until Phase 3 is done and Rishik has picked a concept.**

If he opens with an idea ("I want to build X for hackathon Y"), do not start building X. Say: *"Before we scope this — let me pull who won this thing before. Give me 10 minutes."* Then run Phase 1. His idea may well survive the research; it just has to survive it first.

The one exception: a hackathon that ends in under ~6 hours. Then compress Phase 1 to a single pass over the winners gallery (15 min, hard cap) and move.

## Phase 0 — Pin down the target

Ask for, or find, these. Do not proceed on guesses:

- Exact hackathon name + URL (Devpost page, MLH page, or host site)
- Deadline, with timezone, and **hours remaining right now**
- Is it online, in-person, or hybrid? Solo or team?
- The prize tracks / categories (sponsor prizes are often far easier to win than Grand Prize)
- Any stated theme or constraint

If Rishik gives only a name, search for the URL and confirm it with him before researching the wrong event.

## Phase 1 — Deep research: find what actually won

Read `references/finding-winners.md` for exact URL patterns, search queries, and platform-specific tricks.

Target: **5–8 real winning projects**, prioritized in this order:

1. Previous editions of *this exact hackathon* (strongest signal by far)
2. The same host/organizer's other hackathons
3. The same sponsor's prize winners at other events (sponsors reuse their criteria)
4. Same-domain hackathons (climate, fintech, health, AI-agent...) from the last ~18 months

For each winner, capture — from the actual submission page and demo video, not from a summary:

- What it won (Grand Prize? A sponsor track? Which one?)
- The **problem framing** in the first two sentences of their pitch
- The **wow moment** — the single thing in the demo that makes someone lean forward
- Demo format: video length, first 15 seconds, live or recorded, narrated or captioned
- Scope: how many features actually worked vs. were described
- Tech stack, and whether the stack was itself the story
- Submission page shape: image count, section lengths, what they led with

**Run this research in parallel.** Spawn 3–5 `general-purpose` agents, one per research lane (prior editions / sponsor tracks / domain winners / demo-video teardown), each returning a filled `templates/winner-brief.md`. This is a case where fan-out is correct — say so to Rishik and run it.

**Verify every winner is real.** Open the submission page. A project you cannot load is not evidence. Never cite a winner from memory alone — hackathon results are exactly the kind of specific, checkable fact that is easy to get wrong, and a fabricated winner poisons the whole plan.

## Phase 2 — Extract the pattern

Write the findings into a single brief and put it in front of Rishik. Read `references/what-wins.md` for the durable patterns to test the evidence against — but the evidence from *this* hackathon always overrides that file.

Name explicitly:

- The **problem shape** that keeps winning here (personal-pain? institutional? absurd-fun? infrastructure?)
- The **demo shape** that keeps winning here
- The **scope ceiling** — what a winner actually got working in this time window
- What winners here consistently *skipped* (this is where we stop over-investing)
- Any visible judge bias (a judge who works on developer tools rewards developer tools)

## Phase 3 — Reverse-engineer the rubric, then pitch

Find the **official judging criteria** and their weights. They are usually on the hackathon's rules page and are usually ignored by entrants. If weights are published, they are the spec.

Then build a scoring table: criteria down the side, and **three distinct concepts** across the top. Score each concept 1–5 per criterion, weighted. Include Rishik's own idea as one column if he has one.

Present all three with the scores and a recommendation. **Rishik picks.** Do not start building on your own favorite.

For each concept also state: the one-sentence pitch, the wow moment, the riskiest technical unknown, and what gets cut first if time runs short.

## Phase 4 — Build, with the demo as a first-class deliverable

Budget backwards from the deadline:

| Slice | Share of remaining time |
|---|---|
| Core build (the wow moment working) | ~50% |
| Demo video | ~20% |
| Submission page + writeup | ~15% |
| Buffer for the thing that breaks | ~15% |

**The demo video is not optional.** Read `references/demo-video.md`. At most hackathons the video is the judges' first and often only contact with the project; many never open the live site. If Rishik says he doesn't want one, push back once, clearly, with that reason — Habitat Pulse skipped it and lost. If he says no again, that's his call: proceed, and note it as a known scoring gap in the plan.

Build order inside the core slice:

1. The wow moment, end to end, ugly — first
2. The path a judge will walk in the demo — second
3. Everything else — third, and cut freely

Things to deliberately **not** over-invest in unless the rubric rewards them: exhaustive test suites, architectural purity, edge-case handling on paths the demo never touches, README depth. Do them if they're cheap; never at the cost of the demo.

Things that punch above their weight: it loads fast and doesn't error live; it looks intentional; the first screen explains itself without narration; it works on a phone if judges browse on one.

## Phase 5 — Submission page as its own workstream

The submission page is scored artifact, not paperwork. Work through `templates/submission-checklist.md`.

Non-negotiables: demo video embedded and public; live link that works from a logged-out incognito window; public repo; every eligible prize track selected; caption on every image; honest attribution section.

## Phase 6 — Pre-submit, 2+ hours out

Run the full checklist against the live submission. Open the public URL logged out. Play the video start to finish. Click every link. Submit with hours to spare, then keep polishing — most platforms let you edit until the deadline.

## After results

Win or lose, write what happened into memory (`hackathon-*` memories). If there's judge feedback, capture it verbatim — it is the highest-value input this skill can get. If there isn't, say so plainly rather than inventing a reason for the outcome.

## Files

- `references/finding-winners.md` — where winners actually live; exact queries and URL patterns
- `references/what-wins.md` — durable patterns in hackathon judging, and what's noise
- `references/demo-video.md` — the 90-second video that judges actually watch
- `templates/winner-brief.md` — per-winner research capture
- `templates/submission-checklist.md` — pre-submit gate
