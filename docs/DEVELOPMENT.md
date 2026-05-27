# Development Guide

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (`npm install -g pnpm`)
- **A modern browser** (Chrome, Firefox, Safari, Edge)

## Setup

```bash
# Clone the repository
git clone https://github.com/zynorr/cell-sandbox.git
cd cell-sandbox

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js development server with hot reload |
| `pnpm build` | Create an optimized production build |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint across the codebase |
| `pnpm test` | Run the Vitest test suite |
| `pnpm test:watch` | Run tests in watch mode |

## Workflow

### Typical Development Loop

1. Make changes to components, lib, or store
2. Run `pnpm test` to verify existing tests still pass
3. Run `pnpm build` (or `npx tsc --noEmit`) to catch type errors
4. View changes in the browser at `localhost:3000`
5. Commit and push

### Adding a New Cell Template

1. Open `src/lib/templates.ts`
2. Add a new entry to the `CELL_TEMPLATES` array:
   ```typescript
   {
     id: 'my-template',
     name: 'My Template',
     description: 'What this template does',
     category: 'token', // 'token' | 'nft' | 'dao' | 'auth' | 'demo'
     color: 'bg-green-600/20 text-green-300 border-green-600/30',
     cells: [
       {
         capacity: '6100000000',
         lock: { codeHash: '0x...', hashType: 'type', args: '0x' },
         type: null,
         data: '0x',
         dataMode: 'hex',
       },
     ],
   }
   ```
3. The template will automatically appear in the template browser

### Adding a Known Script

1. Open `src/lib/script.ts`
2. Add a new entry to the `KNOWN_SCRIPTS` array with:
   - `name` — display name
   - `codeHash` — the script code hash
   - `hashType` — type, data, data1, or data2
   - `description` — what the script does
   - `cellDep` — (optional) cell dep for the on-chain script deployment

### Adding a New Store Slice

1. Create `src/store/slices/yourSlice.ts` following the existing slice pattern
2. Export the slice type and creator function
3. Compose it into the store in `src/store/sandbox.ts`
4. Access it in components via `useSandbox(state => state.yourField)`

## Testing

### Running Tests

```bash
pnpm test        # Single run
pnpm test:watch  # Watch mode for TDD
```

### Writing Tests

Tests live next to their source files in `__tests__/` directories:

- `src/lib/__tests__/` — unit tests for pure functions
- `src/components/__tests__/` — component tests with Testing Library

Example test structure:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('renders without crashing', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeDefined()
  })
})
```

## Vercel Deployment

The project is configured for Vercel deployment via `vercel.json`:

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

The faucet API proxy at `src/app/api/faucet/route.ts` connects to the Nervos testnet faucet directly — no environment variables needed.

## Troubleshooting

### `pnpm install` fails

```bash
# Clear pnpm store and retry
rm -rf node_modules
pnpm store prune
pnpm install
```

### Type errors after pulling

```bash
# Ensure dependencies are up to date
pnpm install
pnpm build
```

### Tests fail locally

```bash
# Clear test cache and retry
npx vitest clearCache
pnpm test
```

### Port 3000 already in use

```bash
# Use a different port
pnpm dev -- -p 3001
```

## Project Conventions

- **File naming**: PascalCase for components (`CellEditor.tsx`), camelCase for utilities (`cell.ts`)
- **Imports**: Use `@/` path alias for src directory imports
- **Exports**: Prefer named exports over default exports
- **CSS**: Tailwind utility classes; avoid custom CSS unless necessary
- **State**: Zustand store for global state, React state for local UI state
- **Types**: Shared types in `src/types/index.ts`, local types colocated with usage
