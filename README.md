<p align="center">
  <img src="public/logo.svg" width="112" alt="Gatecast logo">
</p>

<h1 align="center">Gatecast</h1>

<p align="center">
  <strong>Cast your Human Design chart. In your browser. Nothing leaves it.</strong>
</p>

<p align="center">
  <a href="https://github.com/alex-quiterio/gatecast/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/alex-quiterio/gatecast/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://alex-quiterio.github.io/gatecast/"><img alt="Live site" src="https://img.shields.io/badge/live-github%20pages-a78bfa"></a>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178c6">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-fbbf24">
</p>

Gatecast computes a Human Design chart from a birth date, time and place, and explains every part of it:
the BodyGraph, the gate wheel, Type, Strategy, Authority, Profile, centers, channels and gates. You can
compare two people (electromagnetic, companionship, dominance and compromise dynamics) and browse the
whole system in a searchable library, with an info tooltip on everything.

**Live: <https://alex-quiterio.github.io/gatecast/>**

## Why it is different

- **Private by design.** Everything is computed in your browser. There is no server, no analytics and no
  network call at runtime. Saved people live in `localStorage`, on your device only.
- **Real astronomy.** Planetary positions come from
  [astronomy-engine](https://github.com/cosinekitty/astronomy) (an MIT-licensed, arcminute-accurate
  ephemeris). The engine is cross-checked in CI against the Swiss Ephemeris (see
  [How accuracy is tested](#how-accuracy-is-tested)).
- **Shareable.** A chart or a comparison is a link. The birth data lives in the URL hash, so it is never sent
  to a server.
- **Fully typed.** Strict TypeScript from the maths to the DOM, no framework.

## Develop

Requires [Bun](https://bun.sh) 1.3 or newer.

```sh
bun install
bun run dev      # build and serve http://localhost:3000, rebuilding on change
bun run check    # typecheck, lint, format check and tests (what CI runs)
bun run build    # static site in dist/
```

| Script                 | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `bun run dev`          | Builds, serves `dist/` and rebuilds on change |
| `bun run build`        | Bundles the app into `dist/`                  |
| `bun run test`         | Runs the unit and cross-check tests           |
| `bun run typecheck`    | `tsc --noEmit` with strict settings           |
| `bun run lint`         | ESLint (typescript-eslint, strict)            |
| `bun run format`       | Prettier, writing changes                     |
| `bun run format:check` | Prettier, check only                          |

## How it is organised

```
src/
  types.ts      shared contract: Chart, Comparison, Activation...
  engine/       ephemeris, gate wheel, BodyGraph logic, chart and comparison maths
  content/      every meaning, name and tooltip text
  ui/           SVG renderers (BodyGraph, wheel, composite), views, router, tooltips
scripts/        build and dev server (Bun)
test/           unit tests and the Swiss Ephemeris cross-check
```

The engine has no DOM dependency and the renderers return strings, so almost everything is unit-tested
without a browser.

## How accuracy is tested

A Human Design chart has two moments: the **Personality** (birth) and the **Design**, when the Sun was
exactly 88 degrees of arc earlier (about 88 days before birth). Each of the 13 bodies is placed on one of
the 64 gates (5.625 degrees each) and one of its six lines (0.9375 degrees each).

`test/fixtures/swisseph-reference.json` holds positions computed with the Swiss Ephemeris for a set of
invented birth moments between 1930 and 2025. The test suite checks the TypeScript engine against it,
including gates, lines, Type, Authority and Profile. A line boundary is a hard edge: a few arcminutes of
difference, or a birth time that is a few minutes off, can move a planet into the next line or gate. That is
true of every Human Design tool. If your chart differs from another tool, compare the Profile and defined
centers, and check your birth time first.

## Deploy

Pushing to `main` runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml): typecheck, lint, format check,
tests and build, then the `dist/` folder is deployed to GitHub Pages. In a fork, enable it under
**Settings → Pages → Source: GitHub Actions**.

## Disclaimer

Human Design is a system for self-reflection. It is not science, and it is not medical, psychological,
financial or legal advice. Use it as a prompt for curiosity, not as a verdict about who you are.

## License

[MIT](LICENSE). The astronomy library is MIT too; see its repository for details.
