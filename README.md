# AEGIS ORBIT — The Last Keeper

[![make.fun best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/Elvan08/best-game-01-entry/rank.svg)](https://make.fun/bounty/best-game-01)

Every star in the sky has gone out but one.

Aegis is the last lit world, and the Hollow — things that feed on light —
fall toward it night after night. You are its Keeper: not a soldier, the one
who stayed. Your cannon rides a ring around the planet; shoot down the cinder
rocks, snuffer drones, dimweavers and gloam carriers before they tear the
shield apart, salvage the wreckage, and refit between nights — because the
next night is always darker. Each night has a name, and the Keeper keeps a
log. How many nights can the light be held?

A wave-defense arcade game for the desktop browser: one guardian, one planet,
no second chances.

## Play

```sh
node serve.ts        # then open http://localhost:8080
```

Or serve `game/` with any static file server and open `game/index.html`.
No build step, no network requests, no dependencies.

- **Mouse** — aim; your guardian swings around the orbit ring to face it
- **Hold click** — fire
- **Space** — nova blast: clears everything near the planet (limited charges)
- **A / D or ← / →** — orbit the ring by keyboard
- **1–5** — buy in the shipyard between nights
- **Enter** — launch the next night (also starts a run from the title / end screens)
- **P or Esc** — pause · **M** — mute

Mint **star cores** drop from wrecks (carriers always drop one): shoot a core
to bank a nova charge. In the shipyard you can buy a faster cycler, twin
cannons, shield regeneration, overcharged bolts and spare nova charges.

## Handing it in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
to the output directory and writes `dossier.json` with the vendored
`vendor/makefun-game.ts` library:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots are real renders of this code, posed deterministically through
`game/src/shots.js` (`?shot=start|play|shop|end&seed=1`, see `shots.json`).

## Layout

- `game/index.html` — the page
- `game/src/config.js` — every balance knob: planet, bolts, enemies, waves, shop
- `game/src/world.js` — state, spawning, combat, waves, the shipyard
- `game/src/render.js` — all drawing: planet, ships, HUD, screens
- `game/src/audio.js` — procedural WebAudio effects, no audio files
- `game/src/input.js`, `game/src/random.js`, `game/src/shots.js`, `game/src/main.js`

MIT licensed — see `LICENSE`.
