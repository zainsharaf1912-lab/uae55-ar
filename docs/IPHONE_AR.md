# Interactive AR on iPhone

## Can the same experience run in iPhone Safari?

**Not directly.** Safari on iPhone and iPad does not implement WebXR AR (`immersive-ar`). Apple ships WebXR
only in Safari on Apple Vision Pro. Chrome and Firefox on iPhone use the same WebKit engine, so they cannot
provide it either. Safari's built-in AR route, AR Quick Look, only shows static USDZ models, so it can't run
this interactive story.

**The route used here:** [Needle Go](https://appclip.needle.tools/about) is a free Apple **App Clip** (a tiny
app that opens from a link, with no App Store install). It runs a normal WebXR web page on top of Apple's ARKit,
with **hit-testing (surface detection) and DOM overlays**, the two features this experience uses. So
the **exact same page**, the same three.js world, scenes, animations and Arabic interface, runs in real AR on iPhone.
There is no second version and no rebuild. You open it with a link:

```
https://appclip.needle.tools/ar?url=<the deployed HTTPS address of this site>
```

The splash screen builds that link automatically on iPhone ("ابدأ بالواقع المعزز على iPhone").

| Option | Same interactive experience? | Effort | Verdict |
|---|---|---|---|
| Safari WebXR | — | — | Not available on iPhone |
| AR Quick Look (USDZ) | ❌ static model only | low | Rejected (not interactive) |
| **Needle Go App Clip (WebXR on ARKit)** | ✅ same code as Android | **none (a link)** | **Implemented** |
| Native iOS app (ARKit / RealityKit) | Would need a full rebuild in Swift | very high; Mac, Xcode, App Store review | Only if an App Clip is unacceptable |
| Commercial WebAR SDK (e.g. Zappar, Blippar) | Partial port, licence fees | high | Not needed |
| 8th Wall | Hosted service shut down in 2026; open-source engine has no SLAM | — | Not viable |

## What changed for AR (the 3D experience is untouched)

* **iPhone launch:** the Quick Look button was replaced by the Needle Go link (a plain link, because Safari only opens App Clips from a direct tap).
* **Taps in AR:** a tap now becomes a ray through the exact point you touched, using the AR camera. This works the same on Android and inside the App Clip. Chrome's `select` events are still supported as a fallback, and duplicates are filtered so one tap never fires twice.
* **Session start:** if a runtime rejects an optional feature, AR retries with only the essentials.
* **Scene 4 in AR only:** the palm-frond shade over the weaving corner lifts away (as the majlis roof does), because in AR you look down from above. It comes back when you leave scene 4 or AR.
* **Scan screen:** the guide moved to the top so the surface marker in the centre is visible, and the empty caption bar is hidden until the world is placed.
* **Exit:** the ✕ button now returns to the start screen cleanly.

## Step by step on iPhone

**Before you start:** iOS 16.4 or later; **Safari** (App Clips don't open from Chrome on iPhone); a well-lit table or floor with some texture (plain white or glass is hard to track); about 1 m of space.

1. **Open the link in Safari** (or scan the QR code with the Camera app and tap the banner).
2. Tap **«ابدأ بالواقع المعزز على iPhone»**.
3. A **Needle Go** card slides up from the bottom. Tap **Open**. The very first time on a device, Safari sometimes needs a **second tap** on the button before the card appears.
4. The same start screen loads inside Needle Go. Tap **«ابدأ بالواقع المعزز»**.
5. **Allow camera access** when iOS asks. If you tapped "Don't Allow" by mistake: Settings → App Clips → Needle Go → Camera → on, or delete the App Clip and open the link again.
6. **Find a surface:** point the phone at the table about 30–50 cm away and move it slowly left and right. A ring and a 50 cm square appear on the surface.
7. **Place the world:** tap the screen. The neighbourhood appears on the table, facing you, about 50 cm wide.
8. **Interact exactly as in 3D:**
   * tap the green pins (the door, barjeel, dhow, ghaf; then the family members);
   * tap **the door** → it opens and the house unfolds;
   * scene 3: tap **the oyster**, then **the pearl**;
   * scene 4: tap **the basket** and step through the four stages;
   * scene 5: tap **the grandmother** to hear her story;
   * scene 6: tap **the television** to watch the story of the Union;
   * scene 7: the family gathers, the flag rises and the "55" appears.
9. **Move the world:** pinch with two fingers to resize and twist to rotate. The side buttons do the same: ↻ ↺ + − and **«إعادة الوضع»** to place it somewhere else.
10. **Navigate:** use **التالي / السابق** at the bottom or the ☰ scene menu. Walk around the table and lean in to look into the rooms.
11. **Finish:** ✕ at the top ends AR.

## Limitations to expect

* **First launch** downloads the small App Clip (a few seconds) and shows Needle Go branding on the card (custom branding is a paid Needle option).
* **Not in iOS Chrome/Firefox:** the App Clip card only appears from Safari or the Camera app's QR scanner.
* **Tracking quality** depends on light and surface texture, as in any ARKit app; very dark or glossy surfaces may not be detected.
* **AR screenshots** taken in the App Clip may not include the camera image (a known Needle Go limitation); use the iPhone screen recorder instead.
* **Audio:** narration uses the phone's Arabic voice if available. Captions are always shown.
* **No anchors** in Needle Go yet: if tracking is lost (phone covered or pointed at the ceiling), the world can drift. Use **«إعادة الوضع»** to place it again.
* **The 3D preview inside claude.ai cannot use the camera.** AR always needs the HTTPS deployment.
* Needle Go is a third-party service: if it is unavailable, the site still runs fully in 3D mode on iPhone.

## Diagnostics (temporary)

Add `?debug=1` to the address (e.g. `https://zainsharaf1912-lab.github.io/uae55-ar/?debug=1`) and start AR the normal
way. A green status panel shows the session, surface detection, placement, world position and scale, visible meshes,
draw calls, frame rate and any errors. A **magenta cube** floats 35 cm ahead at the upper left of the view (if you can't
see it, nothing 3D is being drawn), and a **cyan cube** marks the placement point. Without `?debug=1`, none of this appears.
