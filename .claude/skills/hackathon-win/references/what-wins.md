# What wins

Prior beliefs only. **Live evidence from the hackathon being entered overrides everything here.** Use this to interrogate the research, not to replace it.

## The core asymmetry

Judges spend somewhere between 90 seconds and 5 minutes per project. They are tired, they are looking at dozens of entries, and they are scoring against a rubric.

Everything follows from that:

- They watch the video. They often don't open the site.
- They never read the code. Not once. Not the tests, not the architecture, not the commit history.
- They read the first two sentences of the writeup and skim the rest.
- The first 15 seconds of the demo decide whether they're paying attention for the rest.

Effort spent below that waterline is invisible. It can still be worth doing — it makes the demo work — but it earns zero points directly.

## What consistently scores

**A problem stated in one sentence, by a person who has it.** "My grandmother's care home has no way to X" beats "a platform for holistic Y" every time. Specific and small reads as real. Broad and important reads as a pitch deck.

**One thing that visibly works.** A single feature demoed end to end, live, with real data, beats six features described. Judges have seen a thousand mockups; working is rare enough to be the differentiator.

**A wow moment in the first 15 seconds.** Something surprising, visual, and immediate. Not the login screen. Not the landing page. The thing.

**Real data over fake data.** Live API calls, a real device, a real user's file. Hardcoded demo data is spotted instantly and reads as "doesn't work."

**Obvious use of the sponsor's tech, when a sponsor prize is in play.** Sponsor tracks are frequently the highest expected-value target: fewer entrants, an explicit and narrow criterion, and prizes comparable to the main track.

**Looking intentional.** Not beautiful — intentional. Consistent spacing, one font, a deliberate palette, no default-bootstrap smell. This is cheap and it moves scores.

**Naming the limitation yourself.** One honest sentence about what doesn't work yet buys credibility for everything else in the pitch. Judges are experienced enough to find the gap; saying it first turns it into a strength.

## What reliably doesn't score

- Test coverage, CI, clean architecture, type safety, lint config
- README depth, docs sites, contribution guides
- Feature count and settings screens
- Accessibility and SEO *as pitch points* (do them because they're right; they're not points)
- Deployment sophistication
- "We used 14 technologies"
- Anything the demo doesn't touch

None of this is worthless as engineering. It is worthless as *scoring*. That distinction is the whole lesson of Habitat Pulse.

## Recurring winning shapes

Test the research against these; expect one or two to dominate at any given event.

1. **The specific personal problem** — narrow, real, obviously felt by the builder.
2. **The absurd but flawless** — silly premise executed with visible technical competence. Wins "most fun" and often more; judges remember it.
3. **The hard-tech demo** — something that looks impossible in the time budget (hardware, on-device ML, real-time). Wins on the "how did you do that" reflex.
4. **The sponsor showcase** — a genuinely good use of the sponsor's product that the sponsor would want to screenshot.
5. **The one-feature killer** — does exactly one thing, does it perfectly, no menu, no settings.

Shapes that reliably lose: the general-purpose platform, the dashboard aggregating public data, the AI wrapper with a chat box, the "marketplace connecting X and Y."

## Time-boxed reality

What actually gets finished:

| Window | Realistic winner scope |
|---|---|
| 24h | One feature, one screen, real data, working demo |
| 48h | One feature done well + a second that supports it, polished |
| 1 week | The above + a genuinely good video and submission page |
| 1 month | Add real users, real deployment, real evidence of use |

Longer windows shift the differentiator from "does it work" to "did anyone use it." At a month-long hackathon, three real users with quotes beat three more features.

## The pre-mortem

Before committing to a concept, ask: *it's judging day and we lost — why?* The most common honest answers:

- The demo didn't show anything surprising
- It was a category judges have seen fifty times
- The video didn't exist, or was five minutes of a screen recording with no narration
- It broke live
- It was technically strong in ways nobody could see

Fix the answer before it happens.
