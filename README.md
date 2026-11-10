# حكاية وطن.. تجمعنا أسرة — A Nation's Story, A Family's Legacy

A mobile **WebAR** experience for the UAE's **55th Eid Al Etihad** and the **Year of Family 2026** ("Growing in Unity" · ننمو معاً),
produced for the **College of Mass Communication, Ajman University**.

A visitor scans a QR code, places a miniature Emirati neighbourhood (فريج) on a real table, opens the family house
door, and meets a family of seven, one member for each of the seven emirates' brand colours. The visitor watches the father explain
pearl diving, the mother teach her daughter palm-frond weaving (السفافة), the grandmother tell stories in the majlis, and an old
TV show the story of the Union. The experience ends with the family gathering beneath the rising flag and the official "55".

## Run it

```bash
# any static HTTPS server works; for local development:
npx serve .            # or: python3 -m http.server 8080
# open http://localhost:8080 on the computer (3D mode)
```

WebXR needs a **secure origin**. To try AR on an Android phone during development, use Chrome remote debugging with
`adb reverse tcp:8080 tcp:8080` and open `http://localhost:8080` on the phone (localhost counts as secure), or deploy (see `docs/DEPLOYMENT.md`).

No build step is required: the app is plain ES modules + an import map that loads **three.js r160** from jsDelivr.
`node tools/build-preview.mjs` produces an optional single-file bundle in `dist/`.

## What runs where

| Device / browser | Mode | What the visitor gets |
|---|---|---|
| Android phone · Chrome (ARCore / Google Play Services for AR) | **WebXR AR** (`immersive-ar` + `hit-test` + `dom-overlay`) | Surface detection, tap-to-place, pinch/twist to scale/rotate, tap hotspots and props, full story, narration, audio |
| iPhone / iPad · Safari | **WebXR AR through the Needle Go App Clip** (ARKit) | The same interactive AR as Android: surface detection, placement, all interactions. See `docs/IPHONE_AR.md` |
| Desktop / any WebGL browser | **3D mode** (labelled "ليس واقعاً معززاً") | The complete interactive story with orbit / pinch / tap |

The mode badge in the interface always states which mode is running. A browser 3D viewer is never presented as AR.

## Project structure

```
index.html                 Arabic RTL shell, import map (three@0.160.0), screens
css/app.css                Brand tokens (official palette), layout, HUD, sheets, finale
js/main.js                 Renderer, scene graph, loop (shared by 3D + WebXR), input, mode switching
js/config.js               Palette, the seven scenes (Arabic script), hotspots, info cards, TV programme
js/scenes/director.js      Scene state machine and every interaction
js/world/                  Procedural stylised 3D world
  materials.js             Shared materials, brand grain, canvas patterns (carpet, mat, cushions, flag, door)
  environment.js           Board, alleys, square, sea, heritage houses, barjeel, palms, ghaf, dhow, jetty, life
  familyHouse.js           Courtyard house, majlis, areesh, stations, the family of seven
  characters.js            Character builder + procedural animation (talk, listen, weave, dive, cheer, walk)
  props.js                 Oyster & pearl, diving gear, safeefah weaving set, majlis set, lantern, vintage TV
  effects.js               Official "55" (traced from the guidelines) extruded in 3D, confetti, hotspot pins
js/tv/tvProgram.js         Original animated Union sequence for the TV (clearly labelled)
js/audio/                  Procedural ambience/SFX (Web Audio) + narration manager (file → Arabic TTS → captions)
js/xr/                     WebXR session (hit-test, placement, screen-tap rays, gestures); quickLook.js is kept but no longer used
js/ui/ui.js                Interface controller (also the WebXR DOM overlay)
assets/brand/              Official logos (vector, cropped from Logo.zip) + traced 55 numeral
assets/fonts/              Official typefaces (subset WOFF): Noto Naskh Arabic, Noto Sans Arabic, Oswald
assets/illustrations/      Official Eid Al Etihad 55 illustrations (extracted from the brand guidelines PDF)
assets/audio/narration/    Slot for recorded Arabic narration (+ manifest.json)
assets/models/             3D asset directory and replacement plan for artist-made glTF models
assets/video/              Slot for licensed archival footage
docs/                      Brand analysis, deployment, QR, audio, asset plan, testing report
tools/                     Preview bundler, QR generator page
tests/                     Headless smoke test + three.js test double
```

## Versions

* `uae55-ar-backup-3d-v1/`: the approved build 1, untouched (checksums in `backup-3d-v1.sha256`).
* This folder: build 2, the same experience with the AR integration adapted for iPhone (see `docs/IPHONE_AR.md`).

## Status at a glance

See `docs/TESTING_REPORT.md` for the full matrix. In short:

* **Built and verified in automated runs:** all seven scenes, the scene navigation, hotspots, the door and the
  dollhouse-style entrance, the oyster and pearl, the four weaving stages, the grandmother's story, the TV programme,
  the finale, Arabic RTL UI, captions, error and permission flows.
* **Built, awaiting on-device testing:** WebGL rendering of the 3D world, WebXR AR on Android, AR Quick Look on iOS,
  Arabic text-to-speech voices.
* **Planned:** recorded voice-over, licensed archival footage, optional artist-made glTF models, the official Year of
  Family logo (not supplied), and full interactive AR on iOS (needs a native app or a commercial WebAR SDK).

## Brand compliance

Palette, typefaces, logo variants and illustrations all come from the supplied packages. The full analysis is in
`docs/BRAND_ANALYSIS.md`. The logo is only shown upright, unaltered, in its framed version on its own background colour,
never animated, rotated or combined with other logos. The university appears as a separate text credit, not a co-branded lock-up.
