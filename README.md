# Antimatter Dimensions

## Run

To run the game locally, you will need to install
[Node.js](https://nodejs.org/) (Node 22.12+ or 24 LTS recommended;
Node 20.19+ is also supported).

First, run the following command in your terminal (or command line) while being
inside the checked out repository:

```
npm ci
```

After all the packages are installed, start up the game:

```
npm run dev
```

Vite serves the game at `http://localhost:8080` (or the next available port).
Vue components update through hot module replacement; changes to game logic may
reload the page. `npm run serve` remains an alias for the same command.
After pulling dependency changes, run `npm ci` before starting the server.

## Build

| Command | Output |
| --- | --- |
| `npm run build` / `npm run build:release` | Production website in `dist/` |
| `npm run build:master` | Website with development features in `dist/` |
| `npm run build:steam-development` | Steam development build in `../AppFiles/` |
| `npm run build:steam-release` | Steam release build in `../AppFiles/` |
| `npm run preview` | Serve the built website locally |
| `npm run lint` | Check JavaScript and Vue files with ESLint |
| `npm test` | Run the existing regression tests |

The build uses Vite 7 and the official Vue 2 plugin with Vue 2.7.16.
`index.html` is the entry point; static assets remain in `public/`.
Relative asset URLs support deployment to a subdirectory such as GitHub Pages.
Production builds retain source maps, browser checks, optional `FIREBASE_CONFIG`
injection, and website commit metadata.

`.env.*` files use `VITE_DEV` and `VITE_STEAM`. `VITE_DEV` controls the game's
development features and save slot independently of Vite's build mode, so
`build:master` still uses the development save slot. Only put public values in
`VITE_*` variables because Vite exposes them to the browser.
Steam builds retain files already in `../AppFiles/`; clean old generated assets
there when packaging a release if needed.
