# Westminster Weather Radar

A responsive, static radar display for Carousel Cloud, designed for a 1920×1080 zone. Upload index.html and radar.js together. No build, account, API key, fonts, or external JavaScript libraries are needed.

## Free GitHub Pages hosting

1. Sign in to GitHub and create a public repository named `atlanta-radar`. Public repositories support Pages on GitHub Free.
2. Choose **Add file → Upload files** and upload `index.html` and `radar.js` directly into the repository root. Commit the upload to `main`.
3. Open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch **main**, folder **/(root)**, and **Save**.
5. Wait for deployment. Open the published address shown in Pages settings, normally `https://YOUR-USERNAME.github.io/atlanta-radar/`.
6. Confirm the map, radar timestamp, and both attribution links appear. Use this published HTTPS address, not the GitHub repository address or a local file URL.

Official instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Carousel Cloud

1. Choose the channel and a full-screen 1920×1080 / 16:9 zone.
2. Create a **Web Bulletin** and paste the published GitHub Pages HTTPS address into its URL field. Do not choose an Interactive Bulletin.
3. Set **Snapshot Delay** to about **15 seconds** as a starting point, so the API and tiles can finish loading. This is a recommendation, not a Carousel default.
4. Save/publish and inspect the actual bulletin preview and Apple TV display. Ensure the entire title, map, timestamp, and footer are visible.
5. Carousel refreshes webpage snapshots automatically every 15 minutes. Apple TV uses snapshots. Other supported players may show the live webpage; this page checks for a newer radar frame every five minutes without animation.
6. If a snapshot catches a loading notice, increase Snapshot Delay and check that the website and tile services are reachable. Actual Carousel rendering must be verified in your account after publishing.

Official guide: https://support.carouselsignage.com/hc/en-us/articles/360050597592-Web-and-Interactive-Bulletins-in-Carousel-Cloud

## Data and behavior

- Verified endpoint: `https://api.rainviewer.com/public/weather-maps.json`.
- Selects the largest valid `time` in `radar.past`; uses the returned `host` and frame `path`, including opaque hashed paths.
- Tile format: `{host}{path}/512/{z}/{x}/{y}/2/1_0.png`.
- Uses native radar zoom 7, Universal Blue (2), smoothing on, separate snow coloring off. Radar is enlarged over the metro basemap to respect the current free API zoom limit.
- Frame time is shown in America/New_York, including daylight-saving time. It is the composite frame timestamp, not an assertion that every radar observation occurred at that exact time.
- A frame older than 30 minutes gets a delay notice. API errors and incomplete tile loads get visible notices. A partial radar layer is never displayed as though complete. API retries occur on the five-minute cycle; reloading retries all layers.
- The approximate Westminster campus center is 33.847, -84.428. The view includes Marietta, Alpharetta, Stone Mountain, downtown Atlanta, and Hartsfield–Jackson. Only Westminster has an added label; other names come from the basemap.
- Westminster is a small green pin with a plain text label and no box. Its tip marks the mapped campus at 1424 West Paces Ferry Road NW (33.84429, -84.43615); the metro map center stays unchanged. Campus coordinate reference: https://www.latlong.net/poi/the-westminster-schools-61098
- There are no controls, animations, analytics, menus, or ads. Required attribution links remain visible.
- RainViewer describes the free API as intended for personal/educational use, without an availability guarantee. Its transition page specifies a 100 requests/IP/minute limit; this page requests only the visible tiles for one frame. Large deployments sharing an IP should account for aggregate requests.
- OpenStreetMap tiles use the browser cache and normal referrer headers. Do not disable caching or suppress referrers in a hosting proxy or renderer. The basemap service is best effort; for larger signage fleets use a provider whose terms cover the expected traffic.

Sources verified September 23, 2026:
- https://www.rainviewer.com/api/weather-maps-api.html
- https://www.rainviewer.com/api/transition-faq.html
- https://www.rainviewer.com/api/color-schemes.html
- https://www.rainviewer.com/api.html
- https://operations.osmfoundation.org/policies/tiles/

## Validation

JavaScript syntax checked. Live API and tile rendering verified in the browser at 1920×1080: ready state, 17 loaded images, zero failed images, no horizontal overflow. A narrow browser view was also visually inspected. The final label changes were checked in the browser. This is not yet hosted or tested in Carousel Cloud itself.
