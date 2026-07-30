# Development Guide

## Prerequisites

- Node.js 20+
- pnpm 9+
- A current Chrome, Firefox, Safari, or Edge browser

## Setup

```bash
git clone https://github.com/zynorr/cell-sandbox.git
cd cell-sandbox
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js development server. |
| `pnpm build` | Create an optimized production build. |
| `pnpm start` | Serve the production build. |
| `pnpm lint` | Run ESLint. |
| `pnpm test` | Run Vitest once. |
| `pnpm test:watch` | Run Vitest in watch mode. |

## Product Boundaries

- Learn is read-only. Do not add raw field editors or wallet controls there.
- Design Cells owns advanced fields, protocol presets, loading, sharing, and export.
- Inspect Tx explains committed input-to-output state transitions.
- Build Tx selects outputs and follows CCC transaction completion. Raw editing belongs in Design Cells.

## CCC as Source of Truth

Do not copy network deployment hashes or cell deps into application constants.

- Add picker metadata to `SCRIPT_DEFINITIONS` in `src/lib/script.ts` using a `ccc.KnownScript` ID.
- Resolve code hash and hash type through `getKnownScriptById` or `getKnownScripts`.
- Add known-script cell deps with `Transaction.addCellDepsOfKnownScripts`.
- Calculate occupied bytes and free capacity through `ccc.CellAny`.
- Use the owning CCC ecosystem package for protocol-specific codecs that are not part of core CCC.

If CCC does not provide a protocol deployment or codec, treat it as an external integration. Document the source and add network-specific tests before exposing it as a preset.

## Adding a Template

Templates are returned by `getCellTemplates(network)` in `src/lib/templates.ts`.

1. Build lock and type scripts with `getKnownScriptById`.
2. Mark a template `sendable` only when Build Tx supports its complete on-chain lifecycle.
3. Add occupied-capacity and protocol-shape tests.
4. Verify both testnet and mainnet rendering when the template is shown on both networks.

## Verification

Run all engineering checks:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm test
pnpm build
```

Then test the visible workflow at desktop and mobile widths. Check Learn, Design Cells, Inspect Tx, Build Tx, template selection, wallet connection, validation, and review.

Engineering checks do not establish newcomer usability. Use [USABILITY_TESTING.md](USABILITY_TESTING.md) for moderated sessions and report only observed results.

## Troubleshooting

If port 3000 is busy:

```bash
pnpm dev -- -p 3001
```

If dependencies or generated Next.js types are stale:

```bash
pnpm install
pnpm exec tsc --noEmit
```

## Conventions

- PascalCase for React components and camelCase for utilities.
- `@/` imports for files under `src`.
- Named exports for reusable modules.
- Zustand for shared state and React state for local presentation state.
- Tests next to source under `__tests__` directories.
