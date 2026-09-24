# Concepts: three candidates scored against the published rubric

Rubric (from the event page): **Originality 25% · Presentation 25% · Visuals 25% · Plausibility 25%**. Each concept is scored 1–5 per criterion, and the weighted total is the mean.

Filters applied first (see `RESEARCH-BRIEF.md`): an everyday or overlooked problem, a visually striking result, real computation, static and on-device, no overlap with Rishik's 14 sibling lanes (`HACKATHON.md`; `scripts/siblings.sh` shows none claimed yet) or his 12 past projects.

---

## A. Low Sun: the glare calendar for your commute
**Pitch:** Twice a year, for a few weeks, the sun rises or sets exactly along the road you drive every day, and you drive blind. Low Sun takes your street's direction and your departure time and shows, for the whole year, the exact mornings and evenings you'll be driving into low sun, then tells you how many minutes earlier or later to leave, and puts those dates in your calendar.

**Wow moment:** a year-long "glare calendar" (365 days × 24 hours) paints in. Your commute is a thin band across it, and the band lights up only where it crosses the low-sun stripes: "You'll drive into the sun on 23 mornings, Feb 4 to Feb 26." Scrub to one of those mornings, and a windshield view shows the sun sitting on the road ahead, 9° up, just under the visor line.

**Why it's overlooked:** everyone who drives knows sun glare, but almost nobody knows that glare is *predictable to the minute, per street, months ahead*. Manhattanhenge is the famous, pretty version of the same geometry, and every east–west commute has its own dangerous one.

**Existing solutions (must be named, per the rules):** the *SunGlare* iOS app and *ZILL: Sun Smart Route Planner* (Android) predict glare along trips. Low Sun's differences: a whole-year *season view* per commute (not trip by trip), a "leave N minutes earlier" planner, a standards-compliant calendar export so warnings arrive in the calendar you already use, fully on-device (no location leaves the phone, no account), and open, published validation of its math.

**Plausibility evidence we can build in:** the NOAA/Meeus solar-position algorithm, checked in unit tests against **NREL's published SPA reference case** (Reda & Andreas 2004: 50.11162° zenith, 194.34024° azimuth) and against the **2026 Manhattanhenge dates published by the American Museum of Natural History** (May 28/29, Jul 11/12). The glare geometry uses the ≤25° horizontal/vertical thresholds from the sun-glare safety literature, adjustable and cited. Crash evidence: Mitra 2014 (Tucson intersections, more crashes eastbound in the morning and westbound in the evening); Das et al. 2022 (1,450 sun-glare crashes in Louisiana narratives, 2010–2016).

**Riskiest unknown:** getting local-time and timezone handling right for every location (DST edges), and computing the year-scan fast enough to feel instant. Mitigation: pure functions with tests at DST boundaries, and a Web Worker.

**Cut first if time runs short:** phone-compass capture of the street heading, then multi-leg commutes.

| Criterion | Score | Why |
|---|---|---|
| Originality | 4 | Glare apps exist (named above), but a year-at-a-glance glare *season* per commute, with a leave-earlier planner and calendar export, is a new framing. The Manhattanhenge angle is memorable. |
| Presentation | 5 | Tells itself in 10 seconds: "your road, your time, these 23 mornings". Universally relatable, a clean issue → solution → implementation arc for the required video. |
| Visuals | 5 | The glare calendar is a genuinely beautiful data plate (curved sunrise and sunset stripes shifting with the seasons), and the windshield view is cinematic. |
| Plausibility | 5 | Exact astronomy, validated in public against NREL and AMNH numbers; works today, on a phone, offline. The honest limits (weather, terrain, buildings) are clearly stated. |
| **Weighted** | **4.75** | |

---

## B. Curbside: a stacked parking-sign decoder
**Pitch:** point your phone at a pole with four contradictory parking signs, and get one answer: "Yes, you can park here until 7:00 AM Tuesday."

**Wow moment:** OCR of a real sign stack, collapsed into a single weekly availability grid.

**Existing solutions:** Nikki Sylianteng's "To Park or Not to Park" sign redesign (a design proposal), SpotAngels, and many hackathon "parking sign reader" builds.

**Riskiest unknown:** on-device OCR accuracy on angled, glare-hit, red-on-white sign photos. It needs real sign photos to tune against, and this VM can't download any (the egress policy blocks image hosts), so the core would be tuned on synthetic signs.

**Cut first:** OCR, falling back to tap-to-build sign templates (which removes the wow).

| Criterion | Score | Why |
|---|---|---|
| Originality | 3 | A well-trodden hackathon idea; judges may well have seen it. |
| Presentation | 5 | Instantly relatable, great before/after. |
| Visuals | 4 | Clean grid, but it's a utility screen. |
| Plausibility | 3 | Regulation parsing is solid, but real-world OCR reliability can't be demonstrated honestly without real photos. |
| **Weighted** | **3.75** | |

---

## C. Deadzone: a Wi-Fi dead-zone planner
**Pitch:** sketch your apartment in 20 seconds, drop your router, and watch the signal flow through the walls as a live heatmap; it then tells you where to move the router (or add a mesh node) so the bedroom stops dropping calls.

**Wow moment:** drag the router, and the heatmap re-flows through the drywall and the brick in real time.

**Existing solutions:** Ekahau and NetSpot (professional site-survey tools), plus router-vendor apps.

**Riskiest unknown:** the propagation model (ITU-R P.1238-style path loss plus per-wall attenuation) is an approximation, and browsers **can't read Wi-Fi signal strength**, so the model can't be calibrated against reality inside the app.

**Cut first:** placement optimisation.

| Criterion | Score | Why |
|---|---|---|
| Originality | 3 | Consumer Wi-Fi heatmaps exist in several forms. |
| Presentation | 4 | Relatable, but it needs a floor-plan drawing step before the payoff. |
| Visuals | 5 | Glowing heatmap through walls is striking. |
| Plausibility | 3 | The model is approximate and the app can't verify itself against the real signal. |
| **Weighted** | **3.75** | |

---

## Decision: **A. Low Sun** (4.75)

It is the only concept that scores top marks on Visuals *and* Plausibility at once, because its centrepiece visual (the glare calendar) **is** the verified computation, not decoration. It needs no data download, no model weights and no key: the product is geometry, and geometry can be proven in public. It gives the required video a natural cold open (Manhattanhenge, then "your street has one too") and a clean *issue → solution → implementation* arc. It doesn't overlap any sibling lane or past project (Shade Debt was satellite heat and tree planting; there's no driving, calendar or glare work anywhere in Rishik's portfolio).

**Pre-mortem: "we lost; why?"** (1) A judge thinks "glare apps already exist". Answer: name SunGlare and ZILL in the video and on the site, and lead with what they don't do (the season view, the leave-earlier planner, calendar alerts, on-device privacy, open validation). (2) "Is the math right?" Answer: the Manhattanhenge proof card and the NREL test, shown on screen. (3) "It looks like a chart tool." Answer: art direction that feels like an almanac plate and a windshield, not a dashboard.
