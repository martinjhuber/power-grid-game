# Power Grid Game

Browser puzzle game: rotate power line tiles until all cells are connected to the central power plant.

## Setup

Choose board **width** and **height** from odd sizes between 5 and 13 (5, 7, 9, 11, 13). Optional wrap mode connects opposite edges (torus).

ES modules require a local web server (not `file://`):

```bash
cd src
npx serve .
```

Then open the URL shown in the terminal (e.g. [http://localhost:3000](http://localhost:3000)).

## Controls


| Action       | Desktop                  | Mobile     |
| ------------ | ------------------------ | ---------- |
| Rotate left  | Click left half of tile  | —          |
| Rotate right | Click right half of tile | Tap tile   |
| Lock/unlock  | Right-click or Space/L   | Long-press |
| Pause        | P or HUD button          | HUD button |




## Project structure

- `src/index.html` — setup screen + game UI
- `src/js/level/` — grid generation, tiles, power flow
- `src/js/render/` — HiDPI canvas rendering with sprite cache
- `src/js/verification/` — anti-cheat session log + replay verifier (for future online highscores)

## Development

The original version of this game was implemented by hand in 2016. The current source code is a full rewrite and extension of that prototype, built with **agentic coding** — an AI coding assistant in [Cursor](https://cursor.com) helped design, implement, and refine the codebase from the initial concept.

## License

[MIT](LICENSE) — Copyright (c) 2016-2026 martinjhuber

