# Product

<!-- impeccable:product-schema 1 -->

> **Interview substitution.** Rishik stated at kickoff that he is unavailable to answer questions and delegated every decision to this session (PROMPT.md, CLAUDE.md "Override"). The init interview was therefore not run. Facts below come from the explicit brief (CLAUDE.md, HACKATHON.md, CONCEPT.md) and the research files; anything inferred rather than stated is marked *(inferred)*.

## Platform

web

## Stack
Delegated: Vite + TypeScript, no UI framework. It's a single-surface tool whose heavy parts are a numeric engine (a Web Worker) and two custom renderers (Canvas for the glare calendar, SVG for the windshield view), so a framework adds weight without adding leverage. Vitest for the engine, Playwright for the demo path, GitHub Pages for hosting. This follows the CLAUDE.md engineering defaults: static-first, no backend, no key, `base: './'`.

## Users
- **Primary:** people who drive the same route at the same times most days: commuters, parents on school runs, delivery and rideshare drivers. The sharpest case is a **new driver** (a US high-school student with a first-period start and an after-school drive home), who has the least experience of driving into the sun and the most fixed schedule. *(Persona, inferred from the concept; there are no real users and none may be claimed.)*
- **Evaluators:** Practice to Create judges, who spend minutes per entry, scored equally on Originality, Presentation, Visuals and Plausibility, most likely on a laptop and possibly a phone.

## Product Purpose
Sun glare is predictable to the minute, for any street, months ahead, yet drivers meet it as a surprise. Low Sun computes the sun's position for every minute of the year on the user's device, finds when a low sun sits in their line of sight on their route at their departure time, and turns that into (1) a year-long glare calendar, (2) named glare seasons ("23 mornings, Feb 4 to Feb 26"), (3) the smallest departure shift that avoids each glare window, and (4) calendar alerts (.ics).
Success means a driver knows their glare dates before they arrive and has a plan for them; a judge understands that in under 15 seconds and believes the maths.

## Positioning
The only glare tool that gives a **whole-year season view per commute** with a **leave-earlier planner** and **calendar alerts**, computed **entirely on-device** (no account, no location upload) with **published, reproducible validation** (NREL SPA reference case and the AMNH Manhattanhenge 2026 dates run as unit tests). Prior art named honestly: the SunGlare (iOS) and ZILL: Sun Smart Route Planner (Android) apps predict glare trip by trip.

## Operating Context
- Used at home while planning a week or a semester, not while driving. The app must never invite use at the wheel. *(inferred; also a safety commitment)*
- Street direction comes from: a compass dial; pointing a phone down the street (the DeviceOrientation compass, corrected for magnetic declination); or two points on the route.
- Location comes from browser geolocation, a preset city list, or typed coordinates. The location is used only on the device.
- The output lives in the user's own calendar app through a standards-compliant .ics file.

## Capabilities and Constraints
- Solar position: the NOAA / Meeus algorithm, validated against the NREL SPA reference case (Reda & Andreas 2004) to within 0.02°.
- Glare geometry: the sun counts as "in the eyes" when it is above the horizon, at or below a vertical limit (default 25°) and within a horizontal limit (default 25°) of the direction of travel. Both limits are adjustable and cited to the sun-glare safety literature.
- **Not modelled:** clouds and weather, terrain, buildings and trees, road grade and curvature within a leg, windshield condition. These are stated plainly in `docs/LIMITATIONS.md` and on the page.
- The network is not needed after load. There is no backend, no key and no analytics.
- Low Sun gives no guarantee of safety and doesn't replace attention, sunglasses or a visor.

## Brand Commitments
- Name: **Low Sun**. Author credit: "Built by Rishik Rontala", visible, plus `<meta name="author">`.
- Rishik's standing bans (CLAUDE.md): no purple/blue gradients, no centred-card SaaS template, no emoji section headers, no Playfair plus drop shadows, no generic 3D blobs, no stock hero illustrations. This entry must not share a template with his other entries.
- Voice: plain, specific, calm. It speaks in dates, minutes and degrees, never in hype or fear. *(inferred)*

## Evidence on Hand
- Validation data: NREL SPA reference case (zenith 50.11162°, azimuth 194.34024°, Golden CO, 2003-10-17 12:30:30 MST); AMNH 2026 Manhattanhenge (half sun May 28 20:14 and Jul 12 20:21; full sun May 29 20:13 and Jul 11 20:20, EDT).
- Safety literature (cited, not overstated): Mitra 2014, *Safety Science* (Tucson intersections; more glare crashes eastbound in the morning and westbound in the evening); Das et al. 2022, *TRR* (1,450 sun-glare crashes in Louisiana crash narratives, 2010–2016); Hagita & Mori and related work on the 25° glare angles.
- **Absent, and never to be fabricated:** users, testimonials, usage numbers, crash reductions caused by this tool, and any street-specific bearing that wasn't computed from coordinates the user supplied or from a documented grid (Manhattan's ~29° grid rotation).

## Product Principles
1. **Dates, not warnings.** Every output is a specific date, time and angle the user can act on.
2. **Prove the maths in public.** Validation is visible in the product, not buried in the repo.
3. **On-device and private by construction.** Nothing about where you drive leaves your device.
4. **Planning, never at the wheel.** It's a tool for the night before, not for the drive.
5. **Name the limits first.** Weather, buildings and terrain are stated plainly, before a judge has to ask.

## Accessibility & Inclusion
WCAG 2.2 AA (CLAUDE.md). The glare calendar has a full text equivalent (season list and table) and keyboard scrubbing. Colour is never the only encoding of glare severity. `prefers-reduced-motion` is honoured, and the layout works at 375 px wide.
