# Corne Trainer ⌨️

Monkeytype-style typing coach for your **Corne v4.1 split keyboard** (Mac + Vial web), with:
- **Typing drills** that tell you WHAT you actually pressed on every miss (`expected "e" — you hit "r", KeyR, right index`)
- **Live keyboard** under the text mirroring your exact layout — hold a layer key (LOWER/RAISE) and it flips layers live
- **Layout editor** — 42 keys × 4 layers, click any key to edit label/output/layer-hold. Autosaves in browser, Export/Import JSON for backup
- **Shortcuts cheatsheet + practice mode** with real modifier detection (⌘ ⌥ ^ ⇧) — add your agent/window/app combos

## Develop

```sh
npm install   # once
npm run dev   # local dev server (http://localhost:5173)
npm test      # unit suites (node --test)
npm run build # static build into dist/ (deployable anywhere)
```

Deploy: push to `main` → GitHub Action builds, tests, and publishes `dist/` to GitHub Pages. Needs a repo with Pages enabled (Settings → Pages → Source: GitHub Actions).

## Run
`npm run dev`, or open the built `dist/index.html` directly (works offline; USB board-read needs the hosted HTTPS version + Chrome/Edge).

## Import your real layout (.vil)
A `.vil` file **is** JSON — just with a different extension. In Vial web: **File → Save current layout** → you'll get `something.vil`. Then in this app click **⬆ Import (.vil)** and select it. That brings over:
- all layers (base, numbers, nav, adjust, … — however many you have),
- `MO(n)` layer-hold keys, `LT` layer-tap keys (tap char types, hold flips layers),
- shifted symbols (`!@#$…`), mod-tap keys, tap-dances (tap side), macros, media/RGB keys,
- transparent `▽` keys are auto-filled from your base layer.

The importer auto-detects the row format and sanity-checks itself (base layer should be mostly letters). Anything it can't name is kept as a raw label and reported — fix leftovers in the Layout tab.

Many AliExpress "Corne v4.x" boards are actually **46 keys**, not 42: an extra inner key on the top row (often Esc / Del) and home row (often Alt / =). Import detects this and switches the Board selector to **Corne+ 46** automatically. The 4 inner extras have no pre-mapped physical key — in Layout, click one, press **Capture**, hit the real key. If the right half comes out backwards, hit **⇄ Mirror right half**.

## Board definitions (any keyboard)
Boards render from real keyboard definitions — the same `matrix → physical position` data Vial itself uses (`vial.json` / QMK `info.json`). Built in: Corne 42 (`split_3x6_3`) and Corne+ 46 rev4.1 (`split_3x6_3_ex2`, stagger and tall thumbs included). For any other board: Layout tab → **📐 Load board definition** → pick any QMK `info.json` → choose a layout → Import your `.vil`. Mapping is then deterministic — no guessing.

## 5-min setup
1. Open Vial web side-by-side → **Layout / Layers** tab here → copy your labels per layer (click key → Save).
2. Keys that are `MO(1)`/`LOWER`/`RAISE` in Vial → kind = **Layer hold** + target layer.
3. **Type** tab → click text → type. **Shortcuts** tab → add combos → Practice mode.

Backups: header ⬇ Export saves `corne-trainer-backup.json`.
