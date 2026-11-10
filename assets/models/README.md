# 3D asset directory

The current build generates every model procedurally in `js/world/` (see `docs/ASSET_PLAN.md`).
These folders are the slots for optional artist-made `.glb` replacements, with the node names
the code expects. Export the procedural world as a GLB reference with `__uae55.exportGLB()`.

| Folder | Procedural source today |
|---|---|
| environment/ | `js/world/environment.js` (board, sea, palms, ghaf, dhow, jetty) |
| architecture/ | `js/world/environment.js` (`makeHouse`, `makeBarjeel`), `js/world/familyHouse.js` |
| characters/ | `js/world/characters.js` (`makePerson`, `makeCat`) |
| props/ | `js/world/props.js` (oyster, diving gear, weaving, majlis, lantern, TV) |
