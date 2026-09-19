# SteerHead Game

2D HDD (horizontal directional drilling) training sim shell.

**Stack:** TanStack Start + TypeScript + Vite  
**Repo intent:** push-ready for `truckernflorida-arch/steerhead-game` (or stealthbore branch)

## Quick start

```bash
cd /workspace/steerhead-game
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build
npx tsc --noEmit     # typecheck
npm run generate-routes
```

## Lesson 1 default

- **Level id:** `S01` only (not SR01)
- **Bible title:** S01 — Dirt Yard
- **Source:** `src/game/levels/school-s01-s12.json`
- **Facts from card:** `soilClass: [light_fill]`, `mud.locked: true`, `bore.length_ft: 120`, `plantFail: none`
- Loader: `loadSchoolLevel('S01')` / `loadLesson1()` used by `/play`

Soil **numbers** (density, cohesion, etc.) stay stubbed until Bot 2. Fail cascades beyond the TickSnap `dummyEmitter` await Bot 2/5 specs.

## TickSnap rule (critical)

**TickSnap is the ONLY physics → UI contract.**

- Physics owns `causes[]`, `verbs[]`, and symptom labels.
- UI (`TrainerHud`) renders `snap.symptoms` + `snap.verbs` via helpers in `src/game/ticksnap/hudProps.ts`.
- **Never** invent copy with `if (id === 'TF_…')` / `RV_*` switches in React.
- Contract lives in `src/game/ticksnap/` (copied from `steerhead/contracts/ticksnap`).

Demo: `/play` drives the HUD with `dummyEmitter` (TF_MIXER_DEAD → TF_PRESSURE_DROP → TF_PACK_OFF).

## Layout (shell)

```text
src/
  routes/           # thin TanStack Start shells (/, /play)
  ui/TrainerHud.tsx # TickSnap-only HUD
  game/
    ticksnap/       # contract (types, dummyEmitter, hudProps, …)
    levels/         # school JSON + loadSchoolLevel('S01')
    loop.ts         # rAF stub
    state.ts / update.ts / render.ts
    input/          # keyboard + touch speed-control stub
    env/soil.ts     # light_fill id stub only
    collision/      # aabb + utilities stubs
    save/           # local progress stub
```

## Mobile

Touch speed-control placeholder API: `src/game/input/touch.ts` (`TouchSpeedControl` / `sampleTouchSpeed`). Bound as a range slider on `/play` for now.

## What is stubbed vs wired

| Wired | Stubbed (TODO) |
|-------|----------------|
| TanStack Start app + routes | Real game loop / physics |
| TickSnap contract + dummy demo HUD | Soil physics numbers (Bot 2) |
| `loadLesson1()` → S01 job card | Fail cascades beyond dummy (Bot 2/5) |
| Canvas placeholder | Real bore/render |
| Touch speed API + slider | Production mobile gestures |
| local save schema | Server sync |

## Architecture reference

See `/workspace/steerhead/ARCHITECTURE.md` (source design tree). This folder is self-contained for GitHub push.

## Runtime note

Scaffolded with official `npm create @tanstack/start@latest` (blank + eslint + nitro). Current `@tanstack/react-start` advertises Node `>=22.12`; this box runs Node 20.19 and **install / build / dev all succeed** here. Prefer Node 22+ when available.
