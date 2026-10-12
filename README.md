# Snoball — website

Single-page site for Snoball, Owled's brand for AI and tech launches and growth marketing.

The page uses plain HTML, CSS and JS with no build step. Three.js (r169) is vendored in `vendor/`.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

You need a local server because ES modules don't load from `file://`.

## How it works

- **Scroll only.** The page uses normal vertical scrolling. Nothing hijacks it and nothing scrolls horizontally. The 3D canvas is fixed behind the content and reads `window.scrollY`.
- **The snowball.** A frosted core is surrounded by about 16k particles (7k on mobile). The particles spiral in and stick to the ball as you scroll down, so the ball "gathers mass". It spins faster while you're scrolling, and at the stats section it flares into a corona.
- **Channel rings.** In the "where conversations happen" section, seven orbit rings stand for X → LinkedIn → YouTube → Instagram → Reddit → Newsletters → Communities. The ring for the channel you're reading lights up.
- **Keyframes.** `KEYS` at the top of `js/main.js` sets the ball's position, size, accretion, rings and burst for each section. Desktop uses `x/y/s/dim` and mobile uses `mx/my/ms/mdim`. Tweak these to re-choreograph the page.

## Before launch

- Replace the `mailto:` placeholder on the CTA in `index.html` (marked `TODO`) with the real contact or booking link.
- The stats are Owled's public website figures. Figures mentioned only on the call (revenue, video volume, studio count) are left out on purpose.
