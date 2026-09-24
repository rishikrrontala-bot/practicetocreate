# Research brief: Practice to Create [Feedback To All Projects!]

*One compressed pass (under 48 h to deadline), Wed Sep 23 2026, 22:29 to 22:36 EDT by the clock (searches batched in parallel).*

## How this research was done, and its limits (read first)
This cloud VM's network policy **blocks devpost.com and every *.devpost.com page**, plus figma.com, oit.uci.edu, wikipedia.org and most other hosts, for both `curl` and WebFetch (see PROGRESS.md › Environment facts). Only WebSearch (which runs server-side) works. So:
- No winner page was opened directly. Each brief in `research/winners/` records exactly what was verified: the project URL, and the prize **as WebSearch read it from the live page**. Anything the index didn't state is written as *unknown* and never guessed.
- No demo video was watched. The demo-shape conclusions below come from the event's own stated video requirements and the skill's `what-wins.md` priors, not from teardown.
- Event facts in `HACKATHON.md` were captured from the live page on 2026-09-23 and were cross-checked through WebSearch's reading of the page and of its Startup Networks mirror (https://www.startupnetworks.co.uk/links/link/30773-practice-to-create-feedback-to-all-projects). Four extra rules surfaced that way and have been added to HACKATHON.md.

## The event, precisely
- **First edition.** There's no earlier "Practice to Create" gallery (searched `site:devpost.com` plus several name variants). Per the skill: with no history, judges, organiser family and same-shape events are the signal.
- **It's mainly an ideathon.** The rules say coding isn't required, and a Figma or Canva prototype or a slide deck is "perfectly acceptable". Prize: personalised feedback to every project (up to 999) from "an experienced innovator", plus 1st/2nd/3rd place certificates.
- **Video rule:** 3–5 minutes, in which "the issue you're solving, the solution, and how it can/is implemented should be clear".
- **Originality rule:** the idea should "ideally be original and new"; you can improve on an existing solution **but must mention it in your presentation**.
- **AI rule:** generative AI is allowed; lying about it is disqualifying.
- **Rubric:** Originality 25 · Presentation 25 · Visuals 25 · Plausibility 25.

## Winners studied (5, all search-verified, none opened; see the briefs)
| Project | Event | Prize (as stated on its page) | Shape |
|---|---|---|---|
| [Book Portal](winners/book-portal.md) | CSYA Hacks 2.0 | 1st Place Ideathon | Specific group (rural students) + one act (share a textbook) + a tangible prototype |
| [Serw](winners/serw.md) | Tech Myst Ideathon 2023 (age-flagged) | Second Prize | Named household segment + an everyday service pain |
| [Endangered Voices](winners/endangered-voices.md) | AI-Driven Learning Tools Ideathon | Gallery winner (placing unknown) | Overlooked problem with human stakes, light solution |
| [In Your Hue Galactic Gallery](winners/in-your-hue-galactic-gallery.md) | UCI Design-a-thon 2024, VR track | Track winner | One fully realised, visually saturated experience |
| [Frame-by-frame SVG animator](winners/frame-by-frame-svg-animator.md) | Figma Make-a-thon 2025 | 2nd place | A prototype that genuinely works, hard part de-risked first |

## Pattern
**Problem shape that wins here:** *the specific, overlooked, everyday problem of a named group.* Ideathon winners name the person (rural students, middle-class households) and the moment of pain in the first sentence. Broad "platform for X" framings are absent from the winners we could see.

**Demo shape that wins here:** the organiser tells us: a 3–5 minute video in which *issue → solution → implementation* is clear. In an ideathon field most entrants will show Figma clicks and slides. **The differentiator available to us is that ours actually runs**, on real computation, deployed, with the math validated in public. That hits Plausibility (25%) directly and Presentation indirectly (a live product demos itself).

**Scope ceiling:** ideathon winners ship a concept plus a prototype. We can far exceed that ceiling in 30 hours, but only the parts a judge *sees* earn points. Spend on the visual centrepiece and the video, not on breadth.

**What winners skip:** backends, accounts, settings screens, feature breadth. We skip them too.

**Judge bias:** one "experienced innovator" gives feedback to every project, and the placings are judged against four equal criteria. An innovator-judge rewards (a) an idea they haven't seen, (b) evidence that it would really work, and (c) an honest account of the prior art. The rule that you must mention existing solutions is a gift: naming the competitors plainly, and stating what we do differently, scores Originality *and* Plausibility.

## What this means for our concept (the filter used in CONCEPTS.md)
1. An everyday, **overlooked** problem that a judge instantly feels, with the person named in sentence one.
2. A **visually striking** centrepiece (Visuals 25%) that also *is* the answer, not decoration.
3. Real, checkable computation with a **published validation** (Plausibility 25%).
4. Existing solutions named and differentiated (an explicit rule of this event).
5. A demo that tells itself in the first 15 seconds (Presentation 25%).
6. Static, on-device, no key, no account: nothing can break when a judge opens it cold.

## Sources used (all via WebSearch, 2026-09-23)
- Event summary via the Startup Networks mirror: https://www.startupnetworks.co.uk/links/link/30773-practice-to-create-feedback-to-all-projects
- Ideathon family pages: https://software-education-ideathon.devpost.com/ · https://ai-learning-tools-ideathon.devpost.com/project-gallery · https://ed-equity-thru-tech-ideathon.devpost.com/
- Winner sources: listed in each brief.
