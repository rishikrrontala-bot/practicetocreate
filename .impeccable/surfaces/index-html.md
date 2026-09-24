---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Surface brief: Low Sun (index.html, single surface)

**Scope and mode:** the whole product is one page, a working tool in **Operate** mode whose first viewport *is* the tool. Visitors: drivers planning their week, and hackathon judges with minutes to spare.
**Audience / job:** set place, street direction and departure times; learn the exact dates and minutes you'll drive into a low sun; take away a plan (leave earlier or later) and calendar alerts.
**Proof / content:** the live computation (never mock data); the Manhattanhenge 2026 and NREL SPA checks computed in-page by the same engine; the named prior art (SunGlare, ZILL); the limits.
**Constraints:** static, on-device, no key; WCAG 2.2 AA; 375 px; reduced motion; LCP < 2.5 s; zero console errors.

**Direction roll:** degraded (the roll service was unreachable because the VM's egress is blocked); no challengers and no quality-bar boards. Grounded list ordered by resonance: 1 windshield and instrument cluster · 2 highway guide signage (MUTCD) · 3 the TV/NWS weather-forecast graphic · 4 split-flap departure board / railway timetable · 5 the driver's-ed handbook · 6 the sunrise tables of an almanac or nautical ephemeris · 7 **cyanotype sun-print (Anna Atkins's photograms, the blueprint)**. Assigned: **7**. Not-built pick for the record: 1 (windshield/instrument cluster; risk: familiar automotive-HUD look). The user was unavailable (stated at kickoff), so the assigned direction proceeds unattended. Build path: code-led (no image generation on this machine).

## Direction contract
THESIS: The sun is the printer. Low Sun presents your commute's year as a cyanotype, a sun-print on Prussian-blue paper where the only marks that burn through to white are the minutes a low sun sits in your eyes. It refuses the category default: a navigation-app map with a weather-style alert card.

OWN-WORLD: Drenched Prussian blue (night #0A2150, paper ground #102E6B, day wash #1A4290) with unexposed-paper white #F3EFE4 for type and marks; the single warm thing on the page is the sun (low-sun amber #FFB547). Material: brushed emulsion edges (a ragged coated border drawn procedurally), paper tooth, photogram silhouettes (a windshield, a visor, a road) as white shapes, step-wedge exposure strips as legends and sliders, plate captions ("Plate I.") set in IM Fell French Canon, UI in Atkinson Hyperlegible Next, numbers in Atkinson Hyperlegible Mono. Hairlines are paper-white at low opacity; there are no cards, no shadows and no gradients.

STORY: The visitor sees a year of their drive exposed as one print, reads a single sentence ("You'll drive into a low sun on 23 mornings: Feb 4 to Feb 26"), scrubs a burn to see the sun on the road ahead, trusts it because the page proves Manhattanhenge to the minute, and leaves with calendar alerts and a leave-earlier plan.

FIRST VIEWPORT: Desktop: IM Fell wordmark "Low Sun" top-left at ~88px, and under it the verdict sentence at ~40px serif, white on blue. Plate I (the glare calendar, 365 × 24 h, the brushed-edge coated field) fills ~62% of the width on the left under the verdict. The right column holds the "exposure slip", a paper-white slip with the commute controls (place, direction via a compass, out/back times), with the primary action "Develop my year" at its foot. Plate II (the windshield photogram) sits under the slip, synced to the scrub. Mobile: wordmark, verdict, Plate I full-bleed, slip, Plate II.

FORM: cyanotype sun-print, position 7 of 7 on the ordered list, seed key 720bc8f1. Signature interaction: **develop**. On load and on every change, Plate I develops like a print in the wash (pale sensitised paper → Prussian blue, with the glare burns left white-hot), then a scrub cursor drives Plate II's sun. Motion grammar: slow chemical fades (600–1600 ms, ease-out), instant scrub.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
