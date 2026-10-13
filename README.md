# Snoball — website

Marketing site for Snoball, Owled's brand for AI and tech launches. It's a static site (HTML, CSS and JS) with no build step. Three.js r169 is vendored in `vendor/`.

**Live:** https://tjcodeiimb.github.io/snoball/ (GitHub Pages, redeploys on every push)

## Run locally

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Page flow

1. **Hero bento:** what Snoball does, the cartoon snowball, the 1.6Bn proof number and where a launch starts.
2. **Clients:** fixed top row (Apple, Emergent, Wispr Flow, OpenAI, Replit, Gamma) plus two sliding rows.
3. **Belief:** the X-first channel order.
4. **Services:** launch videos, launch amplification and creator campaigns.
5. **Past work:** AI creator reels.
6. **Case studies:** Accel Atoms × Tanmay Bhat, Zepto, ACKO, boAt Valour, Godrej, Renée.
7. **How we launch:** five steps and the messaging principles.
8. **Scale:** Owled numbers.
9. **CTA:** "Start your snoball".

## Editing

- **Client logos:** edit the `TOP`, `ROW_A` and `ROW_B` lists in `js/main.js`. Logo files go in `assets/logos/` and are listed in `manifest.json`. A brand without a file shows as its typeset name.
- **Campaign images:** stored in `assets/work/` and cropped from the Owled credentials deck.
- **Intro animation:** the `intro()` block in `js/main.js` copies the upforgeconsulting.com hero entrance. It plays once per fresh visit and is skipped for reduced-motion users.
- **Snowball:** see `createSnowball()` in `js/main.js`.

## Before launch

- Replace the `mailto:` placeholder on the closing CTA (marked `TODO` in `index.html`) with the real booking link.
- Confirm Apple and Emergent are approved to appear as clients.
