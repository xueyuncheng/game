# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev      # Start dev server at localhost:3000
pnpm build    # Production build (static export)
pnpm lint     # ESLint checks
```

No test runner is configured.

## Architecture

**Retro Arcade Game Station** — a Next.js static-export site that hosts browser-based games using Phaser 3.

### Key Data Flow

1. `src/data/games.ts` — game registry (slug, name, description, features)
2. `src/app/play/[slug]/page.tsx` — dynamic game play route
3. `src/components/game-canvas.tsx` — mounts/unmounts Phaser instance
4. `src/games/index.ts` — `createGameConfig(slug, parent)` factory dispatches to the correct Phaser Scene

### Adding a New Game

- Register it in `src/data/games.ts`
- Create `src/games/<slug>/config.ts` and `scene.ts` (follow the existing pattern)
- Add a case in `src/games/index.ts`

### Game Module Structure

Each game lives in `src/games/<slug>/` and typically contains:
- `config.ts` — constants (physics, sizing, speeds, scoring)
- `scene.ts` — main Phaser `Scene` with `preload`, `create`, `update`
- `types.ts`, `animations.ts`, `level-data.ts`, `textures.ts` — split out as complexity grows (see `steel-commando` for the full pattern)

### Gamepad Input

- `src/lib/gamepad/gamepad-manager.ts` — `GamepadManager` polls the Gamepad API, maps buttons/axes to named actions (`moveUp`, `shoot`, etc.), handles dead zones (0.28) and vibration
- `src/store/gamepad-store.ts` — Zustand store; holds the latest input snapshot for UI components
- Phaser scenes read input directly from `GamepadManager`; React components read from the Zustand store

### Deployment

- `next.config.ts` sets `output: "export"` for static HTML
- `basePath: "/game"` and `assetPrefix` are applied only when running in GitHub Actions (checked via `GITHUB_ACTIONS` env var)
- Static params are pre-generated via `generateStaticParams()` in dynamic route pages
