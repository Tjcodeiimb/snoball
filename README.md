# Snoball — website

Marketing site for Snoball, Owled's brand for AI and tech launches. It's a static site (HTML, CSS and JS) with no build step. Three.js r169 is vendored in `vendor/`.

**Live:** https://tjcodeiimb.github.io/snoball/ (GitHub Pages, redeploys on every push)

## Run locally

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## How it works

- **One 3D scene behind the page.** A fixed Three.js canvas draws a cartoon snowball (toon shading and an ink outline). It starts small in the hero and gathers loose flakes. It grows section by section until it fills the bottom of the screen at "Start your snoball".
- **Scroll only.** Scrolling is native and vertical. The scene just reads `scrollY`. Each section has a keyframe in `KEYS` at the top of `js/main.js` (ball position, size, flakes absorbed, orbit rings). Values between sections are blended. On phones the ball tucks into a top corner.
- **Page colour shifts.** Sections are transparent. The page turns navy for the case studies (`data-bg="night"`) and blue for the close (`data-bg="blue"`).
- **Motion.** Includes headline word masks, scroll reveals, the momentum rail and count-up stats. In "Where", the channel list lights its orbit ring around the ball. Cards pick up a pointer light. The intro drops the nav in, raises the headline and pops the ball in.

## Page flow

1. Hero (one screen) with "Trusted by" Apple, Emergent, Wispr Flow, OpenAI, Replit and Gamma.
2. Clients slideshow.
3. Core belief and channel order.
4. The model.
5. Three pillars.
6. Seven distribution surfaces.
7. AI work.
8. Case studies.
9. Messaging and process.
10. Owled scale.
11. Part of Owled.
12. Start your snoball.

## Editing

- **Logos:** files live in `assets/logos/`. Every file listed in `manifest.json` is shown. `TOP` in `js/main.js` sets the fixed six. `tone` in the manifest picks the monochrome treatment.
- **Campaign images:** stored in `assets/work/` and cropped from the Owled credentials deck.

## Before launch

- Replace the `mailto:` placeholder on the closing CTA (marked `TODO` in `index.html`) with the real booking link.
- Confirm Apple and Emergent are approved to appear as clients.
