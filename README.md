# Ram Hub

Ram Hub is a commuter app for Fordham University students. It shows a live simulated Ram Van map, lets you reserve a seat and get a QR ticket for the van, plans the trip from home with transit options, connects you with other commuters on your route through shared groups, and suggests classmates who take the same courses and ride in at a similar time.

> Ram Hub is a student project and is not affiliated with Fordham University operations. Live van positions are simulated demo data.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

- `npm run build` creates a production build.
- Deploys to Vercel with no extra configuration.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | Enables the Google Maps view and live transit directions in the planner. Needs the Maps JavaScript API and Directions API enabled in Google Cloud. Without it, the app shows a built-in SVG route map with moving vans. |

Never commit `.env.local`. It is already listed in `.gitignore`.

## Features

- **Live**: a map of Ram Vans 1 to 4 (plus 5 and 6 at peak) moving between Rose Hill and Lincoln Center. Each van is a white illustrated van with the Fordham logo that carries its painted number and an outline in its direction color (maroon to Rose Hill, blue to Lincoln Center). Tap a van for ETA, next stop, status, a 14-seat floor plan of the van, assigned-seat reservation, a QR boarding pass, cancel, and a waitlist when the van is full. Toasts fire when your van is 5 minutes away and when a waitlist seat opens.
- **Plan**: enter where you start, your campus, and when you need to arrive. Compare Ram Van, subway, bus, Metro-North, LIRR, NJ Transit, and walking by duration, cost, transfers, and leave-by time, with the fastest and cheapest highlighted.
- **Groups**: 45 seeded commute groups across the five boroughs, Long Island, Westchester, Rockland, the Hudson Valley and upstate, New Jersey, and Connecticut. Filter by region, mode, campus, days, and departure time. Join, leave, create your own, and chat inside groups you have joined.
- **Classmates**: matches by shared courses plus overlapping route and arrival time, with a match score. Students who have not opted in appear as initials only and their home area is hidden. Wave, Report, and Block are on every card, next to a safety tips card.
- **Profile**: campus, home area, arrival time, course codes, the privacy toggle, active reservations, reset, and sign out.
- **Service alerts**: a rotating banner under the header, fed by `lib/alerts.ts`.
- **Demo mode**: press `D` (or tap the "Demo data" badge in the header) to open presenter controls. `1` fast-forwards the simulation 20x, `2` injects a delay, `3` fills a van to show full and waitlist, `4` brings out peak vans 5 and 6, `0` resets everything.

## How the real Ram Van works

- 14 seats per van.
- Vans run about every half hour, 6:15 AM to midnight on weekdays.
- $3.50 one way. Lincoln Center students get passes.
- Reserve online up to 48 hours ahead. An unclaimed seat is forfeited one minute after departure.
- Students scan a QR code at boarding.
- Vans 1 to 4 run all day. Vans 5 and 6 add capacity at the peak, 8 to 10 AM and 4 to 6 PM.
- Pickup is at the Rose Hill garage, across from O'Hare Hall, and at 60th and Columbus on the Lincoln Center side.

What Ram Hub simulates: Fordham tracks the vans internally with Samsara GPS, but there is no public live feed. Ram Hub generates van positions, delays, and seat availability as demo data. Nothing here reflects real van locations or real reservations.

## Brand assets

All brand assets were downloaded from fordham.edu and verified. See [public/brand/README.md](public/brand/README.md) for the source URL of each file and how it was processed.

## Project structure

- `app/`: Next.js App Router pages, one folder per tab (`groups`, `plan`, `classmates`, `profile`), plus the Live page at the root, and the root layout.
- `components/`: UI building blocks grouped by feature (`auth`, `live`, `plan`, `groups`, `classmates`, `profile`, `shell` for the app frame, alert banner, toasts, and demo mode, `ui` for shared pieces).
- `lib/`: shared logic and data. `lib/types.ts` is the shared contract that every module imports its domain types from. `lib/constants.ts` holds brand colors, regions, and fares. `lib/vanSimulation.ts` is the simulated live feed. `lib/planner.ts` builds commute options. `lib/matching.ts` scores classmates. `lib/mockData.ts` and `lib/alerts.ts` hold seeded groups, students, and service alerts. `lib/storage.ts` is the only persistence layer, so it can move to Supabase later without touching the UI.
- `public/brand/`: the Fordham logo, Ram Van images, and mascot, with a README listing their sources.

## 60-second demo script

1. **0:00, sign in.** Open the app. Point at the official Fordham logo and the Ram Van photo. Click "Skip with a demo profile" (or type any `@fordham.edu` email to show the check, then go through the three onboarding steps).
2. **0:08, live map.** "Fordham tracks vans internally but students cannot see them. Ram Hub shows every van." Point at the legend: maroon outline is heading to Rose Hill, blue is heading to Lincoln Center, and the number on each icon is the number painted on the van.
3. **0:15, reserve.** Tap a van in "Arriving soonest". Show ETA, next stop, and the seat grid. Pick an open seat, tap Reserve, confirm, then "View ticket" to show the QR boarding pass and the one-minute forfeiture note.
4. **0:28, demo mode.** Press `D`. Press `3` to fill a van, open that van on the map, and tap "Join waitlist". Press `1` to fast-forward: within about 15 seconds a seat opens and the toast confirms your new seat. Press `2` to inject a delay and watch the ETA and status change. Press `4` to bring out vans 5 and 6.
5. **0:42, plan.** Go to Plan. Origin is already your home town. Tap "Find routes" and point at the Fastest and Cheapest badges and the leave-by time.
6. **0:50, groups and classmates.** Go to Groups, tap "For you", join a group, open its chat. Go to Classmates and show a 100% match next to a private student who appears as initials only.
7. **0:58, reset.** Press `D`, then `0`. Everything is back to the start for the next judge.

## Pitch talking points

- **The gap is real.** Fordham already tracks Ram Vans with Samsara GPS, but there is no public feed, so students wait at the garage or at 60th and Columbus without knowing where the van is. Ram Hub is the student-facing layer on top of data the university already has.
- **Built around how the Ram Van actually works.** 14 seats, $3.50 fares, Lincoln Center passes, QR scan at boarding, the one-minute forfeiture rule, 48-hour reservations, and vans 5 and 6 only at peak.
- **Walk up to the right van.** Every icon carries the painted van number and a direction color, so nobody boards the wrong one.
- **More than the van.** Most Fordham commuters come from the boroughs, Long Island, Westchester, New Jersey, and Connecticut. The planner compares every realistic way in, and groups and classmate matching turn a lonely commute into a shared one.
- **Privacy first.** Names are hidden by default, classmates see initials until you opt in, and every card has Report and Block.
- **Ready for real data.** Types, storage, and the simulation are separated, so swapping the simulated feed for Samsara and localStorage for Supabase does not touch the UI.

## Design choices and known limitations

- **Simulated data.** Van positions, seats, delays, and alerts are generated in the browser. Nothing reflects real vans or real reservations. The header shows a "Demo data" badge at all times.
- **Mock sign-in.** Any `@fordham.edu` address passes. There is no password, no email verification, and no server. Everything is stored in this browser's localStorage.
- **Map and route.** The built-in map draws real shorelines (NYC Open Data borough boundaries and US Census areas for New Jersey, in `lib/mapGeo.ts`) and the route follows real road geometry from OpenStreetMap via OSRM (`lib/routes.ts`): Fordham Rd, University Heights Bridge, Dyckman St, then the Henry Hudson Parkway. It is one plausible driving route, not a route confirmed by the Ram Van office. Streets other than the route are not drawn.
- **Van icons are illustrations.** Markers use a drawn white van carrying the Fordham logo (`public/brand/ram-van-illustrated.svg`) rather than a photo. The seat plan follows a Ford Transit 15-passenger layout (front passenger, three rows of two plus one across the aisle, four-seat rear bench), which was not checked against an actual Ram Van.
- **Google Maps is optional and untested with a live key.** With no key the app uses the built-in SVG map, which is what was verified. With a key the code loads Google Maps and falls back to the SVG map on any load or auth error.
- **Planner numbers are estimates.** Without a Google key, durations and fares come from a hand-built table in `lib/plannerData.ts`.
- **Reservations follow the van, not a timetable.** A seat is held on a numbered van for its next trip. The one-minute forfeiture rule is shown on the ticket but not enforced, and tickets are never marked as boarded.
- **Group chat is local.** Replies are canned and messages are not shared between browsers.
- **No automated test suite.** The app was verified with a scripted headless-browser walkthrough at 390px and 1280px, not with committed unit or end to end tests.
- **Next.js defaults changed.** `cacheComponents` from the scaffold is turned off because every screen is client-rendered from simulated state.
