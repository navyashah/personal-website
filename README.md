# navyashah.me

Portfolio for Navya Shah, product manager. Editorial layout with case studies and small working demos.

**Live:** [navyashah.me](https://navyashah.me)

## Structure

- `index.html` · home: hero, selected work, about, contact
- `work/ren.html` · Ren app redesign overview, linking to each part:
  - `work/ren-today.html` · Today (First Run and Themes, including the first day)
  - `work/ren-team.html` · Team, person pages, plans, 1:1 prep, Profile
  - `work/ren-dial.html` · The Dial board (working board demo)
  - `work/ren-mobile.html` · Mobile and voice mode
  - `work/ren-next.html` · The Oct to Jan roadmap
- `work/prototypes/` · the clickable Ren prototypes (First Run, Team, Themes, Oct to Jan)
- `work/ren-website.html` · Ren website relaunch
- `work/local.html` · Local
- `work/caught-before-launch.html` · Spin.AI and Quantech
- `media/ren/proto/` · screens captured from the prototypes
- `assets/css/site.css` · tokens, layout, components
- `assets/css/demos.css`, `assets/js/demos.js` · the interactive demos
- `assets/js/site.js` · image slots, badges, opt-in switcher, screen wall, draft notes
- `pixel-os.html`, `pixel-os-mobile.html` · the previous pixel-desktop site

Plain HTML, CSS and JavaScript. No build step.

## Adding images

Every image slot is a placeholder that shows the file it expects. Drop a file at that path and it appears automatically, with no HTML change. Export at 2x, demo data only, no browser chrome.

The 62 screens on the Ren overview's screen wall go in `media/ren/screens/` as `desktop-<name>.png` or `mobile-<name>.png`. Each placeholder shows its exact file name.

Slots still waiting for an image:

- `media/home/caught.png`
- `media/home/local.png`
- `media/home/ren-website.png`
- `media/local/waitlist.png`
- `media/website/home-after.png`
- `media/website/home-before.png`
- `media/website/newsletter.png`
- `media/website/walkthrough.png`

## Before publishing

`DRAFT = true` at the top of `assets/js/site.js` highlights every missing number (yellow) and unconfirmed claim (blue), with a pill to step through them. Resolve each one, then set it to `false`.

To compare display typefaces, add `?type=fraunces`, `?type=instrument` or `?type=bodoni` to any page URL. The default is Newsreader; `?type=bodoni` shows the earlier Bodoni Moda.
