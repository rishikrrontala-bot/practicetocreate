# Devpost submission: Low Sun

Paste-ready text for the Practice to Create submission form, one block per form field.
Every number below can be reproduced from this repo; the source of each is listed at the bottom.

> **Before you paste (Rishik):**
> 1. You already have a **draft** submission for this event. Replace its contents with this project; don't create a second entry.
> 2. Put the YouTube link in the **Video demo link** field once the video is uploaded (unlisted is fine; it must be playable without a login).
> 3. Optional: if you have a true, first-hand moment of driving into a low sun, add one sentence of your own at the start of *Inspiration*. Nothing in here was invented for you, so only add it if it's real.

---

## Project name

```
Low Sun
```

## Elevator pitch (tagline, 163 of 200 characters)

```
The glare calendar for your commute: the exact mornings and evenings this year you'll drive into a low sun, and how many minutes earlier or later to leave instead.
```

## About the project

*(Paste everything between the two lines into Devpost's "About the project" box. It's Markdown.)*

---

## Inspiration

Every May and July, crowds line up on 42nd Street in New York to watch Manhattanhenge, the few evenings when the setting sun sits exactly at the end of the city's cross streets. It's beautiful from the sidewalk. From the driver's seat, the same geometry means driving straight into the sun.

Any straight road gets its own version of that alignment. For a few weeks in spring and a few in autumn, the rising or setting sun lines up with it, and anyone driving it at that hour can't see traffic lights, brake lights or people crossing. Road-safety research backs this up: a study of intersections in Tucson found more glare-related crashes eastbound in the morning and westbound in the evening (Mitra, 2014), and a review of Louisiana crash reports from 2010 to 2016 found 1,450 crashes where drivers named sun glare as the main cause (Das et al., 2022).

What struck me is that none of this is random. The sun's position is known to a fraction of a degree years ahead, so the dates your commute will blind you are knowable today. Nobody tells you, though. You find out on the morning it happens.

## What it does

Low Sun turns one daily drive into a year-long glare calendar.

1. **Tell it your drive.** Pick a place (your location, a city, or pasted coordinates or a map link), set the direction of the road on a compass, by pointing your phone down the street, or from two points on the road, then set when you leave and how long you drive. There's a morning drive and an evening drive, with "same road, the other way" as the default.
2. **See the whole year at once.** *Plate I* shows every day of the year across and every hour of the day down. The white shapes mark every moment a low sun would sit in your line of sight on that road. Your drives are thin bands across the year, and wherever a band crosses a white shape it lights up amber: those are the drives when the sun is actually in your eyes.
3. **Get dates, not a warning.** For the built-in sample commute (an east–west arterial in Tucson, leaving 7:15 AM and 5:20 PM on weekdays), Low Sun reports: *"In 2026 you'll drive into a low sun on 89 days."* That's mornings eastbound from Feb 18 to Apr 10 and Sep 3 to 25 (55 drives), and evenings westbound from Mar 2 to Apr 17 and Aug 24 to Oct 26 (81 drives).
4. **See it from the driver's seat.** Drag across the plate, or use the arrow keys, and *Plate II* shows the view through the windshield at that exact minute, with the sun drawn at its true angle to the road: "Blinding: sun 6.7° up, 4.2° left of straight ahead."
5. **Plan around it.** Each glare season comes with the smallest change of departure time that clears every drive in it. For the Tucson sample's spring mornings, that's "Leave 17 min later."
6. **Put it in your calendar.** One button exports every remaining glare drive as a standard `.ics` file, with a reminder an hour before, for Apple Calendar, Google Calendar or Outlook.
7. **Check the maths yourself.** A section on the page re-runs the engine live against two published answers (below).

It all runs in your browser. There's no account, no server, no tracking, and your location never leaves your device.

## How I built it

- **Where the sun is.** A TypeScript implementation of NOAA's solar position algorithm (after Meeus), computing the sun's direction and height for every minute of every drive in the year. On NREL's published Solar Position Algorithm reference case (Golden, Colorado, 17 Oct 2003), Low Sun lands within **0.003°** of NREL's zenith and azimuth.
- **Local time, done properly.** Commutes happen in wall-clock time but the sun runs on UTC, and daylight saving shifts the two against each other twice a year. (Arizona doesn't shift at all.) Time-zone handling uses the browser's own time-zone database (`Intl`), with a fast per-year table of daylight-saving changes. The time zone for a pasted location comes from `tz-lookup`.
- **The glare model.** A sun counts as glare when it's above the horizon and within 25° of the way you're facing, both across and up: the zone used in road-safety studies of sun glare. Inside that zone, glare is graded by the angle between the sun and your line of sight. Veiling glare rises roughly with the inverse square of that angle (the Stiles–Holladay relation), so "within 15°" is about three times the glare at the 25° edge, and "within 8°" about ten times. The calendar counts within 15° by default, and you can switch to 25° or 8°.
- **Seasons and advice.** Glare days are grouped into seasons, including winter seasons that run across New Year. For each season, a search finds the smallest earlier or later departure that clears every drive in it.
- **Public checks.** The American Museum of Natural History publishes the 2026 Manhattanhenge dates and times. On each of their four dates, Low Sun puts the sun on the Manhattan grid bearing (299.1°) **within a minute** of their published time, and on three of the four to the exact minute. The page shows this table live, next to the NREL check.
- **The page.** Vite and TypeScript with no UI framework. The year plate is painted on a Canvas, the windshield and compass are hand-built SVG, and the year scan runs in a Web Worker so the page stays smooth while you drag the compass. Shareable links encode the whole commute in the URL.
- **The look.** The design is a cyanotype, the 1840s sun-print process behind Anna Atkins's photograms and the blueprint: an image made by sunlight. Here your year is the print, and only the minutes the sun is in your eyes burn through to white. The type is IM Fell French Canon for plate titles and Atkinson Hyperlegible for everything you read. Atkinson was designed by the Braille Institute for low-vision readers, which fits an app about not being able to see.
- **Tests.** 80 unit tests (Vitest) cover the solar maths, time zones across daylight-saving changes (including Arizona and Sydney), the glare model, seasons, the planner, calendar export, coordinate parsing and every sentence the app writes about your commute, which it builds only from computed numbers.

## Challenges I ran into

- **A threshold that's defensible isn't always useful.** With only the literature's 25° glare zone, the Tucson sample flagged 219 of 261 weekday mornings as glare. That's technically true, since a low sun sits somewhere ahead of an eastbound driver for much of the year, but it's useless as a plan. Grading glare by angle inside the zone, and counting only the sun within 15° of straight ahead by default, cut it to the 55 mornings that matter, grouped into two clear seasons. The 25° count is still one tap away.
- **Proving the maths against Manhattanhenge.** My first check came out about three days off AMNH's dates. The fix wasn't to tune numbers until they matched. I found the Hayden Planetarium's own method (the 299.1° street bearing and the sun's height above the New Jersey horizon) and implemented it. The times now match within a minute. The predicted dates land within one to three days, because AMNH doesn't publish its exact horizon convention, and the project says so instead of hiding it.
- **Daylight saving.** A 7:25 AM departure is a different moment in UTC before and after the clocks change. Every scan is tested against the slow, exact conversion for several zones and every week of the year.
- **Seasons that cross New Year.** A winter glare season from October to March was first split into two pieces. The year walk now starts from a long clear stretch, so it comes out as one season.

## Accomplishments that I'm proud of

- The sun is within 0.003° of NREL's reference, and the Manhattanhenge times are within a minute of AMNH's on all four 2026 dates, checked live on the page, not just claimed.
- It gives real dates and a concrete plan (leave N minutes earlier or later) instead of a vague "watch out for glare".
- The calendar export means the warning arrives the night before, in an app people already use.
- It's fully on-device and private, with no key and no backend, and it works for any place in any time zone.
- The design comes from the subject: sunlight is literally what draws the picture.

## What I learned

- Sun glare isn't bad luck. It's geometry, and for a given road and departure time it's predictable to the minute, years ahead.
- How much "correct" depends on the definition. The same astronomy gives 219 or 55 glare mornings depending on the glare threshold, so the threshold has to be justified (inverse-square veiling glare) and adjustable.
- Time zones are the hard part of any date-and-time product, far more than the astronomy.
- Naming your own limits early (weather, buildings, curvy roads) makes the rest of the claims easier to believe.

## What's next for Low Sun

- **Routes with turns.** The engine already scans a drive as several straight segments with their own headings. The next step is a way to enter them, or to import a route.
- **Horizon height.** Hills and skylines raise the horizon, so the sun appears later than it would over flat ground. A horizon-height setting would sharpen the dates for places like that.
- **The sun behind you.** A low sun at your back can wash out traffic signals and blind oncoming drivers, so that's worth a second warning type.
- **Weather.** Pair the next week's glare drives with the cloud forecast, so a glare day under cloud cover doesn't raise a false alarm.

## Limitations (stated plainly)

Low Sun assumes a clear sky. It can't see buildings, trees or hills, which can hide a low sun but never add one, so a listed day can only turn out milder. Each drive is treated as one straight heading. It's a planning tool for the night before: never use it at the wheel, and it doesn't guarantee a safe drive.

## Existing solutions (named, as the rules ask)

Glare prediction isn't new. **SunGlare** (iOS app) predicts when and where sun glare happens on roads, and **ZILL: Sun Smart Route Planner** (Android app) shows the sun's position relative to the road along a trip, with glare alerts. Low Sun differs by showing a whole **year** of one commute at once, so the seasons are visible months ahead. It also gives the smallest departure change that avoids each season, exports those dates to your own calendar, runs entirely on your device with no account, and checks its maths in public.

## How AI was used

I built Low Sun with **Claude Code (Anthropic)** as an AI coding agent, directed by me. Under my direction, Claude Code ran the background research searches, scored three candidate concepts against this event's rubric (Low Sun scored highest), and wrote the code, the tests, the documentation and a draft of this write-up. The product itself uses **no AI**: every date, angle and minute comes from deterministic astronomy and geometry that anyone can check. A full list of sources, libraries, fonts and tools is in `submission/SOURCES-AND-AI.md` in the repo.

---

## Built with

*(Devpost "Built with" tags, one per box.)*

```
typescript, vite, vitest, playwright, canvas, svg, web-workers, html5, css3, github-pages, github-actions, noaa-solar-position-algorithm, tz-lookup, geomagnetism, fontsource, claude-code
```

## "Try it out" links

```
https://rishikrrontala-bot.github.io/practicetocreate/
https://github.com/rishikrrontala-bot/practicetocreate
```

## Video demo link

```
[YouTube link: add after uploading submission/video/demo.mp4]
```

## Tracks / prize categories

The event lists no separate tracks: every project is judged on Originality, Presentation, Visuals and Plausibility (25% each) for 1st, 2nd and 3rd place, and every project receives personalised feedback. Nothing extra to select.

---

## Where each number comes from (for Rishik; don't paste)

| Claim | Source in this repo |
|---|---|
| 89 days; 55 morning and 81 evening drives; the four season date ranges | Default (Tucson) state for 2026: `src/engine/state.ts` preset, computed by `scanYear` + `findSeasons` + `summarize`; asserted in shape by `tests/words.test.ts`; visible on the live page's first screen |
| "Leave 17 min later" (spring mornings) | `seasonShift` for the Feb 18 – Apr 10 season; shown in "Your glare seasons" on the page |
| 219 of 261 weekday mornings at the 25° threshold | Same state with the threshold set to 25° (`lvl=1`); 261 = weekdays in 2026 (`tests/scan.test.ts`) |
| Within 0.003° of NREL SPA | `tests/solar.test.ts` (asserts < 0.02°; the measured values are Δzenith 0.0030°, Δazimuth 0.0023°), also shown live in the page's proof section |
| Manhattanhenge within a minute on all four dates, three to the minute | `tests/henge.test.ts` and the page's proof table (computed 8:13:46 PM, 8:13:18 PM, 8:20:47 PM, 8:21:32 PM against AMNH's 8:13, 8:14, 8:20, 8:21 PM) |
| "Blinding: sun 6.7° up, 4.2° left" | Plate II readout at the default cursor (the year's worst glare moment for the sample commute: Tue Sep 22, 5:45 PM) |
| 80 unit tests | `npx vitest run` |
| 1,450 crashes, Louisiana 2010–2016 | Das, Sun, Dadashova, Rahman & Sun (2022), *Transportation Research Record*, "Identifying Patterns of Key Factors in Sun Glare-Related Traffic Crashes" |
| Tucson intersections, eastbound AM / westbound PM | Mitra (2014), *Safety Science*, "Sun glare and road safety: An empirical investigation of intersection crashes" |
| AMNH 2026 dates and times; 299.1° bearing | AMNH Hayden Planetarium Manhattanhenge page (2026); the method is as described by henge.nyc |
