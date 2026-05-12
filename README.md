# Wuthering Waves 2nd Anniversary Dango Dash Simulator

[简体中文](./README_zh.md)

A fan-made web simulator for the Wuthering Waves 2nd Anniversary `Cubie Derby` event (I prefer to call it `Dango`).

The app lets you build custom 6-dango lineups, inspect races action by action, simulate tournament brackets, and run large Monte Carlo batches to estimate lineup strength and placement trends.

> The official website for this project is [wuwadango.com](https://wuwadango.com).

## Highlights

- Normal race: Run a single race with step-by-step controls, per-turn playback, auto-run, instant resolution, live leaderboard updates, and animated board state.
- Tournament workflow: Recreate the event format with a preliminary race, then launch the final using either the official qualifying order or a custom reordered start stack.
- Analysis workspace: Review aggregate results in dedicated overview, conditional, and tournament insight panels after a Monte Carlo batch finishes.
- Flexible Monte Carlo runner: Launch preset batches of `100`, `1,000`, or `10,000` simulations, or enter a custom run count, track progress live, and cancel long runs.
- Better lineup tooling: Pick racers by attribute or lineup group, save your current setup locally, and switch between English / Simplified Chinese plus light / dark themes.

## Keyboard Shortcuts

- `Enter`: start the current race when available, otherwise resolve the full race instantly.
- `Right Arrow`: step the next action.
- `Ctrl + Right Arrow`: play the rest of the current turn.
- `Space`: toggle auto-run.

## Tech Stack

This is a client-side SPA built with:

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Cloudflare Vite plugin + Wrangler for local preview and deployment

## Development

Use Node.js `20+`.

```bash
npm install
npm run dev
```

Available scripts:

- `npm run dev`: start the Vite development server.
- `npm run lint`: run ESLint with `--max-warnings 0`.
- `npm run typecheck`: run TypeScript project builds for type validation.
- `npm run check`: run lint and typecheck together.
- `npm run build`: produce a production build after lint and typecheck pass.
- `npm run preview`: build the app and serve it locally through Wrangler.
- `npm run deploy`: build and deploy to Cloudflare.

## Cloudflare Preview / Deploy

The repository includes `wrangler.jsonc` and the Cloudflare Vite plugin, so the production flow is already wired for Cloudflare assets hosting with SPA fallback handling.

Typical deployment flow:

```bash
npm run build
npm run preview
```

When you are ready to publish, authenticate Wrangler if needed and run:

```bash
npm run deploy
```

## Project Structure

- `src/components`: main UI, race controls, setup panels, and dashboards.
- `src/components/analysis`: aggregate analysis views for Monte Carlo results.
- `src/services`: simulation engine, tournament logic, board setup, and analytics helpers.
- `src/hooks`: reusable state hooks, including persistence and UI preferences.
- `src/i18n`: localization dictionaries and translation helpers.
- `src/constants`: static configuration for IDs, attributes, and board metadata.
- `src/types`: shared TypeScript domain types.

## Disclaimer

This is an unofficial fan project and is not affiliated with, endorsed by, or sponsored by Kuro Games.

Simulation results are derived from project-side logic reconstruction and RNG. Reported probabilities are statistical estimates, not guarantees of in-game outcomes.

## License

Released under the MIT License. See `LICENSE` for details.