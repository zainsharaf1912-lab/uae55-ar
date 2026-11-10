# 3D asset directory, placeholders and replacement plan

## Current approach

Every 3D model in this version is **built procedurally in code** (three.js primitives, lathe profiles, extrusions, and
canvas textures drawn in the official palette). These are not grey boxes. They are finished, stylised, low-poly models
derived from the official illustrations, chosen because:

* they stay inside the brand palette exactly and share one consistent look;
* they are tiny to download (the whole world is a few hundred KB of code), so the QR experience loads quickly on mobile data;
* every part can be animated (doors, roof, arms and heads of the characters, the oyster hinge, basket growth, flag);
* they export to USDZ for iOS AR Quick Look and to GLB for artists.

Static parts are merged into a small number of draw calls at load time (`js/utils/merge.js`) for mobile performance.

**Export for artists:** in a browser, open the experience, then run `__uae55.exportGLB()` in the developer console. This
downloads `uae55-world.glb`, which artists can open in Blender as a scale-accurate layout reference.

## Placeholders still in the build (clearly identified)

| Item | Current placeholder | Replacement plan |
|---|---|---|
| Arabic voice-over | Device text-to-speech, plus captions | Record with an Emirati narrator (see `AUDIO.md`), drop the MP3s into `assets/audio/narration/`, list them in `manifest.json`. No code change needed. |
| TV historical sequence | **Original animated sequence**, labelled on screen: «رسوم متحركة أصلية — ليست لقطات أرشيفية» | Obtain licensed archival footage (for example from the UAE National Library and Archives, or the broadcaster that holds the rights), place it at `assets/video/tv-archive.mp4` (H.264, 640×480, 20–30 s), set `ARCHIVE_VIDEO` in `js/config.js`. |
| Year of Family 2026 logo | Not shown (only the theme text "Growing in Unity · ننمو معاً") | Add the official mark to the finale once the identity package is provided, following its own guidelines and the co-branding rules. |
| Music | Procedural oud-like plucks and daf pulse | Commissioned or licensed Emirati folk recording (rights for public exhibition). |

## Optional upgrade: artist-made glTF models

If the team wants hand-modelled hero assets, keep the same names and pivots so they drop in with minimal code changes
(load with `GLTFLoader`, replace the builder's return value). Target budget for mobile AR: **≤ 150k triangles total,
≤ 8 MB total, textures ≤ 1024 px, KTX2/Draco compressed**.

```
assets/models/
  environment/
    board.glb                 28 × 28 m board, sand top, terracotta square, sea (y = 0 is the ground)
    palm.glb                  date palm, pivot at trunk base; crown as a separate node "crown" (sways)
    ghaf.glb                  ghaf tree, pivot at base
    dhow.glb                  pearling dhow with lateen sail, pivot at waterline centre
  architecture/
    house-heritage-a.glb …    neighbour houses with barjeel / danchal / crenellations
    family-house.glb          nodes required: "front-wall" (folds down), "door-left", "door-right" (hinge pivots),
                              "majlis-roof" (lifts), "flag" (rises), plus the static shell
  characters/                 rigged (humanoid) or segmented; nodes "upper", "head", "arm-l", "arm-r" keep the
    grandma.glb               current procedural animation working. Seated and standing variants for grandma,
    father.glb                mother, daughter, son, little girl, little boy.
    mother.glb  daughter.glb  son.glb  little-girl.glb  little-boy.glb
  props/
    oyster.glb                nodes "hinge" (top shell), "pearl"
    diving-gear.glb           deyin basket, hajar stone, rope, fattam, mandoos chest
    weaving-set.glb           fronds, dyed bundles, safeefa coil, basket rings "ring-0"…"ring-8", "lid"
    majlis-set.glb            cushions, carpet, coffee table with dallah and finjan, mabkhara, lantern
    tv.glb                    node "screen" (gets the TV programme texture)
```

Reference for every model: the official illustration cut-outs in `assets/illustrations/` (do not flip them, per guideline p.21).
