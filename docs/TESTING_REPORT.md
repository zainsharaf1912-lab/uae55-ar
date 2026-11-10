# Compatibility and testing report

## Build 2 — AR adaptation (iPhone via Needle Go App Clip)

**Not yet tested on a real phone.** No iPhone or Android device was available to this build. Everything below
was verified with the **real three.js r160** in headless Chromium, with a **simulated handheld WebXR device**
(`tests/mock-webxr.js`: fixed camera pose 42 cm above a virtual table, hit-test on the table plane, DOM overlay,
Chrome-style `select` events). Taps are real touch events at the on-screen positions of the objects.

| Run | Result |
|---|---|
| AR, DOM overlay (the iPhone/Needle Go and Android path) | **27/27 checks pass**, 0 errors: session start, scan guide + reticle, tap-to-place (board 0.50 m wide), door → house opens, father pin → scene 3, oyster opens, pearl card, UI taps don't leak into the scene, basket 4 stages (shade lifts in AR), grandmother story, TV plays, finale (family, flag, 55, card), pinch ×2.47 / twist, re-place, exit to splash, 3D mode afterwards |
| Duplicate-tap check | 7 scene taps handled exactly once each while the runtime also fired 10 `select` events |
| AR without DOM overlay (`select` only) | All 3D interactions work (door, oyster, pearl, basket, grandmother, TV) |
| Runtime that rejects optional features | Retry path: all checks pass |
| 3D mode regression (original flow test + real render) | 0 errors; identical draw-call merging |

What the simulation cannot prove: real ARKit/ARCore tracking quality, the App Clip launch flow, camera permission
prompts, how the image composites with the real camera, and frame rate on the phone. These need the on-device checklist below.

---

# Build 1 report

## 1. What was tested in this build, and how

The development environment had no network access to package registries or CDNs, so **three.js itself could not
be loaded there**. Testing was split as follows.

| Check | Method | Result |
|---|---|---|
| JavaScript syntax (all 18 modules) | `node --check` | ✅ Pass |
| Full application flow | Headless Chromium (Playwright, 390×844 mobile viewport, touch) running the **real app code** against a three.js test double (`tests/mock-three/`), which keeps scene-graph bookkeeping but replaces WebGL | ✅ 0 errors |
| Flow covered by that run | splash → 3D mode → hotspot info sheet → tap the door (scene 2) → hotspot to the father (3) → open oyster → tap pearl → next (4) → basket → all four weaving steps → next (5) → grandmother story → next (6) → TV on → programme runs → next (7) → finale card → restart → menu jumps (5, 7, and back to 1 mid-finale) → exit to splash | ✅ All transitions reached the expected state |
| Single-file bundle (`dist/preview.html`) | Same headless run | ✅ 0 errors |
| Arabic RTL layout, fonts, captions, sheets, finale | Screenshots reviewed at phone width | ✅ Correct shaping, RTL order, no overflow |
| TV programme canvas (Arabic titles, labelling) | Rendered and captured | ✅ |
| Brand assets (logo SVGs, fonts, 55 trace) | Rendered and compared to the guidelines | ✅ |

**Not yet verified, and needed before the public showing:**

* the WebGL rendering of the 3D world (lighting, shadows, proportions, camera framing per scene) on a real GPU;
* WebXR AR on a physical Android phone (session start, surface detection, placement, tap rays, pinch/twist);
* AR Quick Look (USDZ export) on a physical iPhone;
* Arabic text-to-speech voice availability on the target phones;
* frame rate on mid-range phones.

The hosted 3D preview is the quickest way to check the rendering. AR has to be checked from the HTTPS deployment
(see `DEPLOYMENT.md`), because the preview page cannot use the camera.

## 2. Expected compatibility

| Platform | Browser | Expected mode | Notes |
|---|---|---|---|
| Android 8+ with Google Play Services for AR (most mid/high-end phones) | Chrome 81+ | **WebXR AR** + DOM overlay | The phone must be on the [ARCore supported devices list](https://developers.google.com/ar/devices) |
| Android without ARCore | Chrome | 3D mode | The splash explains that AR is not available |
| Android | Samsung Internet | WebXR AR on recent versions, otherwise 3D | Test on the target devices |
| Android | Firefox | 3D mode | No `immersive-ar` support |
| iPhone / iPad (iOS 16.4+) | Safari → **Needle Go App Clip** | **WebXR AR on ARKit** (same interactive experience) | Safari itself has no WebXR AR; the App Clip opens from a link; see `IPHONE_AR.md` |
| iPhone / iPad | Chrome / Firefox for iOS | 3D mode | App Clip cards only open from Safari or the Camera app |
| Meta Quest browser | — | WebXR may work (passthrough AR) | Not a target; not tested |
| Desktop Chrome / Edge / Safari / Firefox | — | 3D mode | Mouse orbit, wheel zoom, click to interact, arrow keys change scenes |
| Very old phones without WebGL | — | Error screen in Arabic with guidance | |

## 3. On-device test checklist

**Android (WebXR)**

- [ ] The splash says the device supports AR; the AR button appears.
- [ ] The camera permission prompt appears; on denial, an Arabic message appears and 3D mode starts.
- [ ] The scan guide appears; the reticle and 50 cm footprint appear on a table within about 5 s in good light.
- [ ] Tapping places the board facing the visitor; scene 1 narration starts.
- [ ] Hotspots are tappable: door → scene 2 with door, wall and roof animation.
- [ ] Pinch scales and twist rotates; the ↻ ↺ + − buttons work; **إعادة الوضع** returns to scanning.
- [ ] Interface buttons do not also trigger taps in the scene.
- [ ] Scenes 3–7 recentre and zoom on their station; all interactions work.
- [ ] The ✕ button ends the session cleanly and returns to the splash.

**iPhone (Safari → Needle Go)**

- [ ] The splash shows «ابدأ بالواقع المعزز على iPhone»; tapping it shows the Needle Go card (a second tap may be needed the first time).
- [ ] Inside Needle Go the splash says AR is ready; the camera prompt appears.
- [ ] The surface is found, tap-to-place works, and every interaction and gesture from the Android list works.
- [ ] 3D mode runs the full story in plain Safari; audio starts after the first tap.

**All**

- [ ] Frame rate stays at or above 30 fps on a mid-range phone in every scene (check scene 7 with confetti).
- [ ] Arabic voice availability: if missing, captions carry the story (the toast explains it).
- [ ] Sound and narration toggles work independently.
- [ ] The QR code scans and opens the HTTPS URL.

## 4. Performance design

* Low-poly procedural geometry, flat shading, no external model downloads.
* Static meshes are merged by material at load (`mergeStatic`). The world has roughly a thousand separate static meshes before merging, so this should cut the draw calls substantially. The console logs the before and after counts (`[perf] draw calls merged`); record them during on-device testing.
* One 2048 px shadow map, pixel ratio capped at 2, instanced confetti, the TV canvas redrawn at 30 fps only while it is on.
* Total download is about 2.6 MB for the single-file build, plus three.js (about 0.7 MB gzipped from the CDN).

If a target phone struggles, lower `sun.shadow.mapSize` to 1024 and the pixel ratio cap to 1.5 in `js/main.js`.

## 5. Known limitations

* iPhone AR depends on the third-party Needle Go App Clip (free; Needle branding on the launch card). Plain Safari runs 3D mode only.
* AR occlusion (real objects hiding virtual ones) is not used.
* Light estimation is requested but not yet applied to the scene lighting.
* The TV shows original animation until licensed archival footage is supplied.
