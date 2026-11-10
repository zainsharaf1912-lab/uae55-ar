# Phase 1 — Brand analysis

## What was supplied and what was inspected

| Package | Status | Contents inspected |
|---|---|---|
| `Eid_Al_Etihad_55_Brand_Guidelines_2026_Updated(1).zip` | ✅ Extracted | 55-page PDF: permanent brand (logo, variants, minimum size, dynamic extensions, co-branding, 16 logo don'ts, typefaces) and the 2026 variable brand (year number, colour scheme, illustrations, ecosystem backgrounds, grain, containers & frames, confetti, visual language, photography, materials, animation style, brand assembly) |
| `Typefaces(1).zip` | ✅ Extracted | Noto Naskh Arabic, Noto Sans Arabic, Oswald, Noto Sans (TTF + OFL licences) |
| `Logo(1).zip` | ✅ Extracted | `Eid Al Etihad_Logo and Variations` in RGB and CMYK (AI / EPS / PDF, 6 artboards: vertical, horizontal, framed vertical, framed horizontal, negative vertical, negative horizontal) |
| `Illustrations.zip` | ❌ **Not received** | The file was not attached to the request. **Workaround:** the guidelines PDF embeds every illustration as a separate transparent image (2048 px). 120 unique cut-outs were extracted directly from the PDF and used. The original vector/PNG pack would still be welcome for higher resolution. |

## Colour: "Seven emirates, seven colours" (p.20)

Sampled from the guideline swatches (sRGB):

| | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| Row 1 | `#BCA9BC` | `#C86757` | `#7CAFDE` | `#F6D178` | `#D58351` | `#E8C7B4` | `#038C85` |
| Row 2 | `#D5D7E3` | `#AB4B23` | `#31677F` | `#E4BE59` | `#A66444` | `#E5DECB` | `#7D9259` |
| Row 3 | `#D3D9CF` | `#F3C4BE` | `#C1DEEE` | `#F6E9BF` | `#F5CAA7` | `#F1ECD6` | `#D1E8CC` |
| Flag | `#B72B38` | `#388245` | `#111820` | `#FEFEFE` | | | |

**How it is used:** terracotta `#C86757` is the ground of the splash, the public square and the info-sheet illustration panels
(matching the brand billboards); teal/petrol form the sea and the 3D-mode backdrop (Brand Assembly page); mint `#D1E8CC`
is the caption "container"; ivory/linen/peach/cream are the house walls. Each of the **seven family members carries one of the
seven row-1 colours**, revealed as rings in the finale (seven members ↔ seven emirates).

## Typography (p.14)

| Role | Typeface | Use in the app |
|---|---|---|
| Primary Arabic | Noto Naskh Arabic | Titles, captions/narration, finale "ننمو معاً", TV titles |
| Secondary Arabic | Noto Sans Arabic | Interface, buttons, hotspot labels |
| Primary English | Oswald | English titles and numerals ("55", "2026") |
| Secondary English | Noto Sans | Not needed (UI is Arabic-first) |

All fonts are bundled locally (subset WOFF, Arabic + Latin) from the supplied files, with their OFL licences.

## Logo (pp.5–13)

* Used: **framed vertical version, ink on its own cream background** (an approved "with frame, with background colour" variant), cropped from the vector AI/PDF without redrawing.
* Never rotated, stretched, recoloured, outlined, animated, bounced or spun; never placed in an unapproved container; never combined with another logo (the university credit is plain text, placed apart).
* The logo is a 2D overlay only (splash and finale), so the 3D camera can never show it distorted or at an angle.

## Variable brand 2026

* **Year number "55" (p.17):** the flat numeral was traced from the guideline artwork into vector polygons (`assets/brand/number55.json`) and extruded in 3D. It lies flat on the square, as the 55 does on the brand covers and on the Brand Assembly page. It rises once in the finale, with no spinning.
* **Illustrations (pp.21–28):** the isometric, top-down style with soft grey shadows is the basis of the whole 3D look: a tabletop diorama seen from above. The 3D characters and buildings are modelled on the official cut-outs: the Families category (white kandura + ghutra + agal, black abaya + shayla, the grandmother's burqa, the girl in the yellow dress), Arts & Crafts (palm-frond weaving, talli, pottery jars), the white-and-blue majlis, heritage houses with flags, date palm, ghaf tree, dhow, black cat. The original cut-outs also appear unchanged in the interface (splash scene, info sheets). Per p.21 they are **never flipped**.
* **Grain texture (p.30):** used as a multiply overlay on the interface and as a subtle material grain on walls and ground.
* **Containers & frames (pp.31–32):** the notched window-shaped panels inspired the caption card, title card and device card.
* **Confetti (p.33):** flag-colour confetti in the finale.
* **Animation style "Together as One" (p.46):** characters use slow, natural, purposeful motion such as breathing, nodding, weaving and gesturing. There is no bouncing UI or spinning branding.
* **Nation of Families (p.19):** reflected in the seven-member, three-generation household and in the finale message.

## Year of Family 2026

The official English theme is "Growing in Unity" ([uaeyearof.ae](https://uaeyearof.ae/about-year-of-2026)); the Arabic line "ننمو معاً" is used as supplied in the brief. The **Year of Family logo was not supplied**, so it is not shown. Only the theme text appears, and the official mark can be added once provided.

## Cultural reference points used

Barjeel wind towers, danchal (mangrove roof poles), pyramid crenellations, studded wooden double doors, the open courtyard (hosh), areesh palm-frond shade, majlis floor seating with dallah and finjan, mabkhara, clay water jars, pearl-diving gear (deyin basket, hajar stone weight, fattam nose clip, rope for the seeb), safeefah weaving, and a 1970s wooden-cabinet television.
