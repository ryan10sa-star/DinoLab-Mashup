# DinoLab-Mashup 🦖

> **A premium Progressive Web App for young paleontologists!**  
> Build custom dinos, hunt fossils, race for gold, collect cards, and unlock achievements!

![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

✨ **Build-a-Saurus Lab** — Mix heads, tails, skins + adjust roar/speed/armor stats  
🪨 **Fossil Hunt** — Dig tiles to complete fossil sets across Desert, Volcano & Ice Age  
🏎️ **Ghost Racing** — Race against the clock, earn Bronze/Silver/Gold medals  
🃏 **Trading Cards** — Unlock Rare, Epic & Legendary cards through gameplay  
🏆 **Weekly Dino Cup** — Complete 4 challenges for the ultimate trophy  
📜 **Daily Quests** — Build streaks for bonus rewards  
🖼️ **Victory Poster Maker** — Generate & download custom victory banners  
🔒 **Parent Controls** — PIN lock to manage save actions  

## Image Gallery

The app includes **27 copyright-free images** from Wikimedia Commons:
- Dinosaur fossils & museum reconstructions
- Prehistoric marine & flying reptiles
- Ice Age megafauna (mammoth, smilodon)
- Paleontological specimens & eggs

## Quick Start

1. From the repo root, run:
	- `python3 -m http.server 8080`
2. Open:
	- `http://localhost:8080`
3. Install as a PWA from your browser menu (optional).

## Implemented in this Repo

- Build-a-Saurus Lab with trait sliders, random naming, and saved dino list
- Fossil Hunt with set completion and card unlock rewards
- Time Trial race loop with medals and best-distance ghost score
- Dino Cards collection with rarity tiers
- Weekly Dino Cup challenge tracker + trophy card unlock
- Victory poster generator (canvas export/download)
- Daily quest + streak tracking
- Parent PIN lock for gameplay actions
- Offline service worker + web manifest for PWA installability
- Photoreal asset manifest pipeline in `data/assets-manifest.json`

## Asset Folder Structure

- `assets/master/` for original licensed files (JPEG/PNG)
- `assets/web/` for optimized runtime files (WebP)
- `data/assets-manifest.json` for attribution + license tracking

Do not ship production assets unless `status` is updated from `todo-source` to a verified licensed state.

## Goal

Make this the coolest kid-friendly dino app in the neighborhood: fast races, exciting fossil hunts, and a collectible dino lab experience that feels premium and polished.

## Product Direction (Kid-Wow + Parent-Safe)

- Big, simple controls and short game loops (30 to 90 seconds per activity)
- Strong reward loop: play, unlock, customize, show off
- Offline-ready PWA for travel and spotty connections
- Parent-safe settings and privacy by default

## MVP Roadmap

### Phase 1: Core Envy Features

1. Build-a-Saurus Lab
	- Mix traits (head, tail, armor, speed) to create custom dinos
	- Auto-generate fun dino names
	- Save favorite creations to a local collection

2. Fossil Hunt 2.0
	- Add set-based fossil collections (example: Desert Set, Volcano Set)
	- Grant clear rewards for completed sets (new skin, sticker, card)
	- Add one hidden “mystery relic” per week

3. Time Trial Racing + Ghost Runs
	- Keep best lap and show ghost racer replay
	- Add 3 track themes (jungle, canyon, ice age)
	- Give medals (Bronze, Silver, Gold) with visible milestones

### Phase 2: The “Show-Off to Friends” Layer

1. Dino Cards Collection
	- Unlock collectible cards from races and hunts
	- Include rarity tiers and friendly stat summaries
	- Create album completion goals

2. Weekly Dino Cup
	- 3 short challenges each week
	- Single trophy screen with kid-friendly brag badges
	- Local leaderboard profiles on one device

3. Victory Posters
	- Generate celebratory share images with player name, score, and dino
	- Keep outputs kid-safe and ad-free

### Phase 3: Polish and Retention

1. Better feedback
	- Confetti, roars, and satisfying haptics/animation cues

2. Quality-of-life
	- Daily mini quest
	- Streak tracker with forgiveness day

3. Parent tools
	- Parent lock for account/settings
	- Session timer and activity summary

## Photoreal Image Requirement (Dinosaurs, Fossils, Prehistoric Animals)

To match your requirement, image quality should feel documentary-level.

### What to include

- Photoreal dinosaur renders (hero images and card art)
- Real fossil photographs (museum-style closeups)
- Prehistoric animals beyond dinosaurs (mammoths, saber-toothed cats, trilobites, etc.)

### Sourcing policy

- Use only assets with clear commercial and redistribution rights
- Keep source attribution metadata per image (title, creator, license, URL)
- Avoid random web-scraped images without license proof

### Recommended sources

- Open-access museum fossil collections
- Public domain archives (example: Wikimedia Commons where licensing is explicit)
- Licensed stock libraries for photoreal reconstructions
- Commissioned or in-house generated renders with full usage rights

### Asset standards

- Resolution: at least 1600 px on the long edge for hero visuals
- Variants: WebP for runtime, PNG/JPEG master for source archive
- Accessibility: include alt text and kid-friendly labels
- Performance: responsive image sizes and lazy loading in the PWA

## Definition of Awesome (Success Criteria)

- First session fun in under 20 seconds
- At least one meaningful unlock every 5 to 8 minutes
- Stable offline play for core loops
- Visual identity is “premium dino documentary for kids”

## Next Build Order (Practical)

1. Implement Phase 1 gameplay loops
2. Add photoreal asset pipeline and attribution tracking
3. Integrate collection/progression system
4. Add weekly challenge framework
5. Ship polish and parent controls
