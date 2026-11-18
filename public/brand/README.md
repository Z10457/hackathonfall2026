# Brand assets

All assets below were downloaded from public Fordham web pages on 2026-11-18 and verified
(`file` type check, pixel dimensions, and visual inspection). The only drawn asset is `ram-van-illustrated.svg`; everything else is a real download.

Ram Hub is a student project and is not affiliated with Fordham University operations.
Fordham names, logos, and photos are property of Fordham University and are used here for a
student hackathon demo only.

| File | What it is | Source URL | Processing |
| --- | --- | --- | --- |
| `fordham-logo.svg` | Official horizontal Fordham wordmark with shield, maroon (355.95 x 95.5 viewBox) | https://www.fordham.edu/media/home/admin-use-only/assets/FOR-Horz-Maroon.svg (site footer on fordham.edu) | None |
| `fordham-logo-white.svg` | Official reversed (white) horizontal wordmark, for the maroon header | https://www.fordham.edu/media/home/admin-use-only/assets/Fordham-Rev-White-F.svg (site header on fordham.edu) | None |
| `ram-van.png` | Ram Van side profile, transparent background (1200 x 426) | https://www.fordham.edu/media/home/departments-centers-and-offices/student-life/0-Dept-of-Transportation-Home-Page.jpg (Department of Transportation page) | Background removed with macOS Vision subject isolation, trimmed, resized |
| `ram-van-icon.png` | Square photo cutout (128 x 128, transparent), no longer used for markers | Same as `ram-van.png` | Fit into a transparent square |
| `ram-van-icon@2x.png` | Retina version of the marker (256 x 256) | Same as `ram-van.png` | Fit into a transparent square |
| `ram-van-photo.jpg` | Ram Van in front of Keating Hall (1600 x 1155), used on the sign-in screen | Same as `ram-van.png` | Resized, recompressed |
| `ram-mascot.png` | Fordham Ram + block F emblem (512 x 512, transparent) | https://www.fordham.edu/media/home/departments-centers-and-offices/student-life/1-Ram-Van-Shuttle.JPG (Ram Van Shuttle page; emblem cropped from the van door) | Cropped, light background flood-filled to transparent, stray specks removed |
| `ram-statue.jpg` | Ram statue photo (240 x 240) | https://www.fordham.edu/media/home/admin-use-only/fordham-ram-mm-01.jpg (fordham.edu mega menu) | Recompressed |
| `ram-van-illustrated.svg` | Illustrated white van (side view, 160 x 80) carrying the Fordham logo. This is the map marker and list icon. | Drawn for Ram Hub. The logo on its side is `fordham-logo.svg` embedded unchanged. | Original drawing |

The photo cutouts (`ram-van.png`, `ram-van-icon.png`, `ram-van-icon@2x.png`) are kept in the folder but the app no
longer uses them for markers. `ram-van-photo.jpg` is still the sign-in background.

## Map data

The built-in map in `lib/mapGeo.ts` and the route in `lib/routes.ts` are generated from open data:

- Borough shorelines: NYC Open Data, Borough Boundaries, https://data.cityofnewyork.us/resource/gthc-hcne.geojson
- New Jersey land: US Census ZIP code tabulation areas via https://github.com/OpenDataDE/State-zip-code-GeoJSON
- Westchester edge: US Census counties via https://github.com/plotly/datasets (geojson-counties-fips.json)
- Route geometry: OpenStreetMap contributors, routed with the public OSRM demo server (https://router.project-osrm.org)

App icons (`app/icon.png`, `app/apple-icon.png`) are derived from `ram-mascot.png` on a white rounded tile.

## What was tried and rejected

- `https://www.fordham.edu/brand` redirects to a Fordham login (CAS), so the official logo download kit is not publicly reachable. The header and footer SVGs on fordham.edu are the same official marks.
- `https://fordhamsports.com/images/logos/site/site.png` and Wikimedia Commons `Fordham_athletics_logo26.png`: both are the gothic "F" athletics mark, with no ram in it, so they were not used as the ram mark.
- `Megamenu_Fordham_Ram_Mascot.jpg` on fordham.edu is only 150 x 150 (tiny thumbnail), rejected.

## Optional manual upgrades

Nothing is missing. If you have access to the official brand kit, you could replace
`ram-mascot.png` with a vector ram mark (keep the same file name, square, transparent background).
