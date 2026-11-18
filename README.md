# Ram Hub

**The commuter app for Fordham students.** See every Ram Van live, reserve a seat with a QR boarding pass, plan your trip from home, and find other students who share your route.

**Live demo:** https://ram-hub-nine.vercel.app/

> Ram Hub is a student hackathon project and is not affiliated with Fordham University operations. Van positions, seats, and delays are simulated.

---

## The problem

Fordham tracks every Ram Van with GPS, but students can't see it. They wait at the Rose Hill garage or at 60th and Columbus without knowing where the van is, whether it is full, or if another way home would be faster. Most Fordham students commute, many from Long Island, Westchester, New Jersey, and Connecticut, and they do it alone.

## What Ram Hub does

| Tab | What you can do |
| --- | --- |
| **Live** | Watch Ram Vans 1 to 4 (plus 5 and 6 at peak) move between Rose Hill and Lincoln Center. Tap a van for its ETA, next stop, and a 14-seat floor plan. Reserve a seat, get a QR boarding pass, cancel, or join the waitlist when it's full. You get a notification when your van is 5 minutes away or a waitlist seat opens. |
| **Plan** | Enter where you start and when you need to arrive. Compare Ram Van, subway, bus, Metro-North, LIRR, NJ Transit, and walking by time, cost, transfers, and leave-by time. Fastest and cheapest are highlighted. |
| **Groups** | Browse 45 commute groups across NYC, Long Island, Westchester, the Hudson Valley, New Jersey, and Connecticut. Filter by region, mode, campus, days, and time. Join, create, and chat. |
| **Classmates** | Find students with the same courses, route, and arrival time, ranked by match score. Students who haven't opted in show as initials only. Every card has Report and Block. |
| **Profile** | Edit your campus, home area, arrival time, courses, and privacy setting. See your active reservations. |

**Accounts:** sign up with any email (password of 8+ characters) or Continue with Google. Profiles are saved in Firestore, so they follow you to any device. **Skip with a demo profile** lets anyone try the app without an account.

## Built around how the real Ram Van works

- 14 seats per van, about every 30 minutes, 6:15 AM to midnight on weekdays
- $3.50 one way; Lincoln Center students get passes
- Reserve up to 48 hours ahead; an unclaimed seat is forfeited one minute after departure
- QR code scanned at boarding
- Vans 1 to 4 run all day; vans 5 and 6 add capacity 8 to 10 AM and 4 to 6 PM
- Pickup at the Rose Hill garage (across from O'Hare Hall) and at 60th and Columbus

## Tech stack

- **Next.js 16** (App Router) with **React 19** and **TypeScript**
- **Tailwind CSS 4**
- **Firebase Authentication** (email/password and Google) and **Cloud Firestore** for student profiles
- **Google Maps** (optional) via `@vis.gl/react-google-maps`, with a built-in SVG map as the default
- Deployed on **Vercel**

## Run it locally

```bash
npm install
cp .env.example .env.local   # optional: add a Google Maps key
npm run dev
```

Open http://localhost:3000. Run `npm run build` for a production build.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | Turns on the Google Maps view and live transit directions. Without it the app uses the built-in map. |

## Firebase setup

The app uses the Firebase project configured in `lib/firebase.ts`. To use your own project, replace that config, then in the [Firebase console](https://console.firebase.google.com/):

1. **Authentication → Sign-in method:** enable **Email/Password** and **Google**.
2. **Authentication → Settings → Authorized domains:** add every domain the app runs on (for example your `*.vercel.app` domain). `localhost` is included by default.
3. **Firestore Database → Rules:** paste the contents of [`firestore.rules`](firestore.rules) and click **Publish**. Each signed-in user can read and write only their own `students/{uid}` document.

## 60-second demo

1. **Sign in.** Click **Skip with a demo profile**.
2. **Live map.** "Fordham tracks the vans, but students can't see them. Ram Hub shows every van." The outline color is the direction (maroon to Rose Hill, blue to Lincoln Center), and the number matches the number painted on the van.
3. **Reserve.** Tap a van under "Arriving soonest", pick a seat, reserve, and open the QR boarding pass.
4. **Demo controls.** Press `D`. Press `3` to fill a van and join its waitlist, `1` to fast-forward until a seat opens, `2` to add a delay, `4` to bring out vans 5 and 6.
5. **Plan.** Open Plan, click **Plan my commute**, and point at the Fastest and Cheapest cards and the leave-by time.
6. **Groups and classmates.** Join a group and open its chat. Show a 100% classmate match next to a private student shown as initials.
7. **Reset.** Press `D`, then `0`, before the next judge.

## Project structure

```
app/            Pages: Live (/), plan, groups, classmates, profile
components/     UI by feature: auth, live, plan, groups, classmates, profile, shell, ui
lib/            Shared logic and data
  types.ts          Shared domain types
  firebase.ts       Firebase app, Auth, and Firestore
  accounts/         Sign-in, sign-up, password reset, profiles (Firebase and demo backends)
  auth.ts           Current student session and profile sync
  vanSimulation.ts  Simulated live van feed
  planner.ts        Commute options
  matching.ts       Classmate scoring
  storage.ts        Local state (reservations, groups, chats)
public/brand/   Fordham logo, Ram Van images, mascot (sources in public/brand/README.md)
firestore.rules Firestore security rules
```

## What's real and what's simulated

- **Real:** accounts and sign-in (Firebase), saved student profiles (Firestore), the van route geometry (OpenStreetMap via OSRM), and the map shorelines (NYC Open Data and US Census).
- **Simulated:** van positions, delays, and seat availability; reservations and the waitlist; service alerts; seeded groups and classmates; canned group-chat replies. Planner times and fares are estimates unless a Google Maps key is set.
- **Stored in the browser:** reservations, joined groups, chats, and the demo profile.

## What's next

- Connect Fordham's existing Samsara GPS feed in place of the simulation (the simulated feed is kept separate from the UI in `lib/vanSimulation.ts`)
- Move reservations, groups, and chat to Firestore so they are shared between students in real time
- Match classmates against real signed-up students instead of seeded profiles

## Credits

Fordham names, logos, and photos belong to Fordham University and are used for this student hackathon demo only. See [public/brand/README.md](public/brand/README.md) for each asset's source.
