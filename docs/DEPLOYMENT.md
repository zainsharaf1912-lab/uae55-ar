# Deploying over HTTPS

WebXR and camera access only work on a **secure origin** (HTTPS, or `localhost`). The project is a static site with no
server code or build step. Upload the folder as it is. Every host below gives HTTPS automatically.

Files to deploy: `index.html`, `css/`, `js/`, `assets/` (you may omit `tests/`, `tools/`, `docs/`, `dist/`).

## Option A — GitHub Pages (free, recommended for a university project)

Add an empty `.nojekyll` file at the root (already included) so GitHub serves every file as is.

1. Create a repository (e.g. `uae55-family-story`) and push the project:
   ```bash
   git init && git add . && git commit -m "UAE 55 AR experience"
   git branch -M main
   git remote add origin https://github.com/<account>/uae55-family-story.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / root → Save**.
3. After about 1 minute the site is live at `https://<account>.github.io/uae55-family-story/`.
4. Optional custom domain (e.g. `uae55.ajman.ac.ae`): add it under Settings → Pages and create the CNAME record the page shows. Tick **Enforce HTTPS**.

## Option B — Netlify (drag and drop)

1. Sign in at app.netlify.com → **Add new site → Deploy manually**.
2. Drag the project folder onto the page. You get `https://<name>.netlify.app` immediately.

## Option C — Vercel / Cloudflare Pages

`npx vercel --prod` from the project folder, or connect the GitHub repository in Cloudflare Pages (framework preset: *None*, output directory: `/`).

## Required headers

None. The app works with default static hosting. If your host sets a restrictive `Permissions-Policy`, allow
`xr-spatial-tracking=(self)` and `camera=(self)`. If you embed the experience in another page with an `<iframe>`, the iframe needs
`allow="xr-spatial-tracking; camera"`. Opening the URL directly (as the QR code does) is the reliable route.

## Offline / exhibition use

three.js loads from jsDelivr (`three@0.160.0`). For an exhibition without reliable internet, download these two files and
change the import map in `index.html` to point at local copies:

* `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js` → `vendor/three/build/three.module.js`
* the `examples/jsm/` folder (only `controls/OrbitControls.js`, `utils/BufferGeometryUtils.js`, `exporters/USDZExporter.js`, `exporters/GLTFExporter.js` and their `libs/` dependencies are used) → `vendor/three/examples/jsm/`

## Checklist after deploying

1. Open the URL on a desktop browser → the splash says "this device or browser does not support web AR" and the 3D mode starts.
2. Open on an Android phone in Chrome → "your device supports AR". Tap **ابدأ بالواقع المعزز**, allow the camera, scan a table, tap to place.
3. Open on an iPhone in Safari → «ابدأ بالواقع المعزز على iPhone» appears and opens the Needle Go App Clip with the same page in AR (see `IPHONE_AR.md`).
4. Generate the QR code from the final URL (see `QR.md`) and test-scan it on both phones.
