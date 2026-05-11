# Wuthering Waves 2nd Anniversary Dango Dash Simulator

A fan-developed web simulator for the Wuthering Waves 2nd Anniversary Dango Dash mini-game.

This tool allows players to build custom 6-dango lineups, simulate step-by-step race outcomes, and run large-scale Monte Carlo analyses to estimate winning probabilities and optimal strategies.

## Key Features

- Interactive Race Engine: Granular control over simulations with step-by-step playback, turn-based progression, auto-run, and instant result generation.
- Tournament Mode: Fully replicates the event's tournament structure, including preliminary race logic and customizable grand final placements.
- Monte Carlo Analysis: Run parallel simulation batches (100, 1,000, or 10,000 iterations) to extract data on win rates, placement stability, and conditional lineup performance.
- Quality of Life: Built-in state persistence via local storage (saves lineup choices, playback speed, and UI preferences), alongside bilingual support (English/Simplified Chinese) and dark mode.

## Technical Overview

The application is built entirely as a client-side single-page application (SPA).

- Framework: React 19
- Language: TypeScript
- Build Tool: Vite
- Styling: Tailwind CSS

## Local Development

Ensure you have Node.js (version 20 or higher) installed.

1. Install dependencies:
   npm install

2. Start the local development server:
   npm run dev

3. Build for production:
   npm run build

4. Run ESLint checks:
   npm run lint

## Project Architecture

- /src/components: React components grouped by UI features and analytical dashboards.
- /src/services: Core simulation engine containing race logic, tournament brackets, and Monte Carlo batch runners.
- /src/constants: Static data configurations for the game board and dango attributes.
- /src/hooks: Custom React hooks managing application state and local storage persistence.
- /src/i18n: Localization files for dual-language support.

## Disclaimer

This is an independent, unofficial fan project and is not affiliated with, endorsed, or sponsored by Kuro Games.

Simulation outcomes are calculated based on reverse-engineered in-app logic and RNG. The generated probabilities are statistical estimates and do not guarantee actual in-game results.

## License

This project is open-sourced under the MIT License. See the LICENSE file for details.
