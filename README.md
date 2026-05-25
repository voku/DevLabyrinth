# The Singleton Labyrinth

The Singleton Labyrinth is an interactive essay game that turns the architectural trade-offs of the Singleton pattern into a playable walkthrough. Each chapter combines story content with a small labyrinth challenge so readers can learn why hidden global state makes systems harder to understand, test, and evolve.

## Live Demo

- GitHub Pages: https://voku.github.io/DevLabyrinth/

## Highlights

- Story-driven walkthrough of common Singleton failure modes
- Interactive labyrinth board paired with chapter-by-chapter explanations
- Responsive UI built with React, Vite, Tailwind CSS, and Motion
- Static deployment target with no runtime backend requirements

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000`

### Quality checks

Run the existing project checks before opening a pull request:

```bash
npm run lint
npm test
npm run build
```

## Deployment

This repository is configured for automatic GitHub Pages deployment.

- Every push to `main` triggers the Pages workflow
- The workflow installs dependencies with `npm ci`
- Vite builds the static site into `dist/`
- GitHub Actions publishes the generated artifact to GitHub Pages

## Project Structure

- `/src/App.tsx` — top-level page layout, chapter state, and completion flow
- `/src/components/LabyrinthGame.tsx` — interactive labyrinth board and challenge logic
- `/src/components/StoryPanel.tsx` — chapter narrative, lesson text, and navigation controls
- `/src/data.ts` — story content and challenge data
- `/src/types.ts` — shared application types
- `/vite.config.ts` — Vite setup and GitHub Pages base-path handling
- `/index.html` — document metadata, favicon, and social preview tags
- `/.github/workflows/deploy-pages.yml` — automated GitHub Pages deployment workflow

## Key Files Detector Helper Prompt

Use this prompt when you want a fast orientation pass over the codebase:

```text
Identify the key files for this repository. Group them by purpose (entry point, app shell, gameplay logic, story content, styling, build/deploy config, and docs). For each file, explain why it matters and what would likely break if it changed. Keep the answer focused on the smallest set of files a new contributor should read first.
```

## Environment Variables

No environment variables are required for local development or GitHub Pages deployment.
