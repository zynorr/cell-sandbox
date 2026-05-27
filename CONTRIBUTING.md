# Contributing to Cell Sandbox

Thanks for your interest! This project is open to contributions — whether it's bug fixes, new features, documentation improvements, or ideas.

## 🚀 Getting Started

1. **Fork** the repo on GitHub
2. **Clone** your fork:
   ```bash
   git clone https://github.com/your-username/cell-sandbox.git
   cd cell-sandbox
   ```
3. **Install dependencies**:
   ```bash
   pnpm install
   ```
4. **Start the dev server**:
   ```bash
   pnpm dev
   ```
5. **Run tests** to make sure everything is green:
   ```bash
   pnpm test
   ```

## 🧪 Before Submitting

- **Tests pass** — run `pnpm test` and fix any failures
- **No type errors** — run `pnpm build` or `npx tsc --noEmit`
- **Lint clean** — run `pnpm lint`
- **One change per PR** — keep pull requests focused on a single concern

## 📁 Project Tour

| Directory | Purpose |
|---|---|
| `src/app/` | Next.js pages, layout, API routes |
| `src/components/` | React components (cell editor, flow canvas, wallet, etc.) |
| `src/lib/` | Pure logic — CCC helpers, schemas, templates, share utils |
| `src/store/` | Zustand store — state management slices and composition |
| `src/types/` | TypeScript type definitions |

## 🧠 Design Principles

- **Separation of concerns** — UI components stay dumb; business logic lives in `lib/`
- **Type safety** — avoid `any` casts; prefer Zod schemas for runtime validation
- **Simplicity** — fewer dependencies, less indirection
- **Testability** — pure functions in `lib/` are easy to unit test

## 🐛 Reporting Issues

Open a [GitHub issue](https://github.com/zynorr/cell-sandbox/issues) with:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS info if relevant

## 💡 Feature Requests

Open an issue with the label `enhancement`. Describe:
- What you want to build and why
- How it fits into the existing architecture
- Any relevant context (CKB RFCs, CCC docs, etc.)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
