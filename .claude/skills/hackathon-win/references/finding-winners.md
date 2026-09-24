# Finding winners

Goal: 5–8 **verified** winning projects, opened and read. Not summaries, not memory.

URL patterns below are starting points, not guarantees — platforms change. If one 404s or returns nothing, fall back to search. Never report a winner you couldn't load.

## Devpost (most hackathons)

Hackathon site is `https://<slug>.devpost.com/`.

| Page | URL |
|---|---|
| Main page — winners appear under prize sections after judging | `https://<slug>.devpost.com/` |
| Project gallery | `https://<slug>.devpost.com/project-gallery` |
| Winners only (try this filter, verify it applied) | `https://<slug>.devpost.com/project-gallery?is_winner=true` |
| Rules + judging criteria | `https://<slug>.devpost.com/rules` |
| Judges list | `https://<slug>.devpost.com/details/judges` |
| A single project | `https://devpost.com/software/<project-slug>` |
| Global project search | `https://devpost.com/software/search?query=<terms>` |
| A person's portfolio | `https://devpost.com/<username>` |

**Finding prior editions.** Slugs usually carry the year or an ordinal: `hackthehabitat-2025`, `treehacks-2024`, `hackmit2023`. Try the obvious variants directly, and search `site:devpost.com "<hackathon name>" 2025 winners`.

**High-value move:** open a winner's Devpost *portfolio*. Serial hackathon winners have a whole page of wins — that's a free sample of what scores, across many events.

**The gallery itself is data.** Sort by likes/popularity. Compare the top of the gallery to the actual winners: where they diverge tells you what judges valued that the crowd didn't.

## Other platforms

- **MLH** — `https://mlh.io/seasons/<year>/events`; individual events almost always link out to a Devpost.
- **Kaggle / AI competitions** — winners publish solution writeups in Discussions. Read the top-3 writeups; they are unusually explicit about what worked.
- **ETHGlobal** — `https://ethglobal.com/showcase` with event and prize filters; finalist demo videos are posted per event.
- **Lablab.ai, Hackerearth, Unstop, Major sponsor hackathons** — each has its own gallery; find it before assuming Devpost.
- **Self-hosted hackathons** — look for `/winners`, `/results`, `/showcase`, or a recap blog post.

## Search queries that work

Run several; they surface different things.

```
site:devpost.com "<hackathon name>" winner
"<hackathon name>" 2025 winners announced
"<hackathon name>" recap OR results OR "congratulations to"
"<sponsor name>" hackathon prize winner <year>
site:youtube.com "<hackathon name>" demo
"<hackathon name>" judging criteria
```

Also check: the host's X/Twitter and LinkedIn around the results date (winners get announced there first, often with video), the sponsor's engineering blog, and `r/hackathon` threads.

## What to actually read, per winner

Skimming the tagline is worthless. For each one:

1. **Watch the demo video.** Note its length, and what happens in the first 15 seconds.
2. Read the "Inspiration" and "What it does" sections — copy the exact first two sentences. That framing is the thing being imitated.
3. Look at the image gallery: how many, what they show, screenshots vs. diagrams vs. photos of hardware.
4. Open the repo. Check the commit timestamps — how much was actually built during the event? What was pre-existing?
5. Note the gap between what the writeup claims and what the demo shows. Winners are often *less* built than they read.

## When there is no prior edition

First-time hackathon, no history. Then:

1. The **judges** are the signal. Look up each one — their company, their public work, what they've said they care about. A judge from a devtools company rewards devtools.
2. The **sponsors** are the signal. Sponsor prizes exist to show off the sponsor's product; a project that uses it non-trivially and shows it off wins that track nearly by default.
3. Fall back to same-domain winners from other events in the last 18 months.

## Verification bar

Before a project goes in the brief:
- [ ] The submission page loaded
- [ ] The prize it won is stated on the page (not inferred)
- [ ] The demo video played, or is confirmed missing
- [ ] The date is within the last ~24 months, or its age is flagged
