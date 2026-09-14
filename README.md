# Pitch Lab

A local-first React / Vite / TypeScript pitching workspace, built from `college_pitch_data_visualizer_spec.md`.

## Run

```sh
npm install
npm run dev
```

Open the local URL Vite prints (normally http://localhost:5173).

```sh
npm test
npm run build
```

## Included

- Responsive Swiss-inspired dashboard, shared pitch metadata and colors, and fictional demo sessions.
- Local CSV parsing, alias matching, vendor hints, editable column mapping, unit confirmation, row warnings, pitcher selection, and date-based session grouping.
- Arsenal summary, individual/average movement, release, location, and spin charts; pitch and velocity filters.
- Educational glossary and metric dialogs.
- Validated nine-parameter flight reconstruction, three 2D views, an interactive 3D pitching world, average/individual paths, position scrubber, and pair separation chart.
- Multiple sessions and per-pitch metric comparisons.
- Unit and React integration tests.

No login or backend. CSV contents stay in browser memory and are cleared on reload; only column mapping preferences use localStorage. Google Fonts loads typography but receives no pitch data. System fonts work offline.

## Import conventions

Review mappings, units, and coordinate conventions before importing. `VerticalBreak` is **not** silently mapped to induced vertical break. Rapsodo schemas vary; ambiguous columns need manual mapping. Missing and malformed metrics remain blank and produce warnings. All rows remain available. See [calculation documentation](docs/CALCULATIONS.md).

The first usable slice plus basic/advanced 2D tunneling is implemented. Later scope includes Excel, vendor-specific coordinate transforms verified against real fixtures, persistent session storage, outcome filters, and richer spin illustrations. No live player export was provided, so vendor compatibility is tested with synthetic fixtures rather than certified against a device export.

## Browser checks

With the dev server running, run `npx playwright install chromium` once, then `npm run test:browser`. The smoke check covers all routes, filters, education, tunneling controls, CSV import, pitcher selection, and mobile overflow/navigation. Screenshots are saved in `docs/`.

## 3D tunneling

The Tunneling page opens in a Three.js world. Drag to orbit, scroll/pinch to zoom, and right-drag to pan. Four camera presets provide keyboard-accessible viewpoints. Play/pause/reset and speed controls animate the existing distance-based comparison; playback is deliberately slowed and does not represent simultaneous real-time pitch arrival. Paths and scene dimensions remain in feet. The generic pitcher is illustrative, not reconstructed mechanics, and ball markers are enlarged for visibility. WebGL failure offers the existing 2D views. Three.js loads only when opening the 3D viewer. Run `node scripts/check-3d.mjs` with the dev server running to verify it.

## GitHub Pages deployment

Live site: https://tatejones2.github.io/pitcher_site/

The Pages workflow installs from the lockfile, runs tests, builds, and deploys `dist/` after pushes to `main`. Pushes to `development` and pull requests into `main` run the same checks without deploying. Manual deployment is available through the workflow on `main`. GitHub Pages must use **GitHub Actions** as its source in repository Settings → Pages.

Production assets use `/pitcher_site/`. Production navigation uses hash URLs (for example, `/pitcher_site/#/tunneling`) so direct links and refreshes work on static hosting. Local development continues to use `/tunneling`. To preview the Pages build, run `npm run build` followed by `npm run preview`, then open `http://localhost:4173/pitcher_site/`.

Continue work on `development`; merge to `main` when ready to publish. The deployed app still processes pitch data locally.
