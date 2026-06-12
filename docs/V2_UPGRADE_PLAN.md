# DinoLab Mashup V2 Upgrade Plan

## Current Baseline

- Static PWA app shell with offline service worker, manifest, local state, and no server dependency.
- Asset manifest tracks 33 local Wikimedia-sourced assets with creator, license, source URL, alt text, and master/runtime file paths.
- CI now validates the app shell, web manifest, service-worker cache list, asset metadata, local asset file presence, and JavaScript syntax.

## Ship-Blocking Guardrails

- Keep every production image at `status: ready` with source URL, creator, license, and alt text before release.
- Keep `assets/master/` and `assets/web/` in sync with `data/assets-manifest.json`; no unreferenced or missing image files.
- Keep the app boot sequence intact: manifest, stylesheet, app script, asset manifest fetch, discovery gallery render, and service-worker registration.

## V2 Work Queue

1. Add installable PWA icon and screenshot assets to `manifest.webmanifest`.
2. Add a browser smoke test that opens the app, verifies the gallery renders from `data/assets-manifest.json`, and confirms service-worker fallback behavior.
3. Add an in-app attribution view that exposes title, creator, license, and source URL for each asset.
4. Convert runtime images to responsive WebP/AVIF variants while preserving master originals.
5. Add parent-facing privacy copy for local-only saves and poster downloads.
6. Add lightweight accessibility checks for touch targets, keyboard navigation, contrast, and image alt coverage.

## Deployment Notes

- No package install is required for local static serving.
- Local smoke: `python3 -m http.server 8080`, then open `http://localhost:8080`.
- CI smoke: `python tools/validate_static_app.py`, `node --check app.js`, and `node --check sw.js`.
