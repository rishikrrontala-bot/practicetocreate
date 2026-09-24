# CONCEPT: Low Sun

**Event:** Practice to Create [Feedback To All Projects!] · **Lane:** open, an everyday overlooked problem with a visually striking result · **Claimed:** Wed Sep 23 2026, 23:25 EDT

**One line:** *The glare calendar for your commute.* Low Sun shows the exact mornings and evenings this year when you'll be driving straight into a low sun, and how many minutes earlier or later to leave to avoid it.

**The problem:** sun glare blinds drivers on predictable dates. For a few weeks each year, the rising or setting sun lines up with any given street (Manhattanhenge is the pretty version), and a driver on that street at that time can't see signals, brake lights or pedestrians. The geometry is exact and knowable months ahead; nobody tells you.

**The user:** anyone with a fixed daily drive, for example a new driver with a 7:25 AM eastbound trip to school and a 5:40 PM westbound trip home. (This is a persona, not a real user.)

**What it does**
1. Take a place (geolocation, a city, or coordinates) and a street direction (compass dial, "point your phone down the road", or two points).
2. Compute the sun's position every minute of the year on-device (the NOAA/Meeus algorithm, validated against NREL's SPA reference case and the AMNH 2026 Manhattanhenge dates).
3. Paint the **glare calendar**: 365 days × 24 h, with the commute band lit where it crosses the low-sun stripes.
4. Summarise the **glare seasons** ("23 mornings, Feb 4 to Feb 26"), show a **windshield view** of any moment, suggest the **smallest departure shift** that avoids each glare window, and export them all as an **.ics calendar** with alerts.

**Wow moment (first 15 s of the video):** the calendar paints in, the band lights up, the count lands, then scrub to a glare morning and the windshield view shows the sun sitting on the road ahead.

**Named prior art:** the SunGlare (iOS) and ZILL (Android) apps. We differ with the whole-year season view, the leave-earlier planner, calendar alerts, being fully on-device and private, and open validation.

**Stack:** Vite + TypeScript, pure-function engine in a Web Worker, Canvas + SVG, Vitest + Playwright, GitHub Pages. No backend, no key, no tracking.

Full scoring: `research/CONCEPTS.md` (A 4.75 · B 3.75 · C 3.75).
