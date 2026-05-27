# Cell Sandbox

A visual playground for the Nervos CKB Cell Model. Design, inspect, and simulate CKB cells and transactions in your browser.

## Features

- **Visual Cell Designer** — edit capacity, lock/type scripts, and data with live preview
- **Cell Templates** — pre-built configurations (Simple Transfer, xUDT, Spore DOB, DAO, Omnilock, Always Success)
- **Transaction Flow** — React Flow canvas to assign cells as inputs/outputs and preview balance
- **Live Testnet** — connect JoyID wallet, claim testnet CKB from faucet, send real transactions
- **Data Preview** — auto-parses xUDT amounts, DAO deposit blocks, and Spore content from raw hex
- **Share via URL** — encode your cell designs into a shareable link
- **Export Code** — generate CCC TypeScript from your cells

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo

1. Connect JoyID wallet
2. Click **Get 10,000 CKB from Faucet**
3. Open Templates → **Simple Transfer**
4. Switch to **Tx Flow** view, mark cell as output
5. Click **Send Tx**

## Tech Stack

- [Next.js](https://nextjs.org) 16 — App Router
- [Tailwind CSS](https://tailwindcss.com) v4
- [@ckb-ccc/ccc](https://github.com/ckb-devrel/ccc) — CKB JS/TS SDK
- [React Flow](https://reactflow.dev) — transaction flow visualization
- [Zustand](https://github.com/pmndrs/zustand) — state management
- [JoyID](https://joyid.dev) — wallet connection

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Lint code |

## Project Structure

```
src/
  app/
    api/faucet/     Faucet proxy route (server-side)
    layout.tsx      Root layout
    page.tsx        Main page
  components/
    CellView.tsx        SVG cell renderer
    CellEditor.tsx      Cell property editor
    ScriptSelector.tsx  Script picker dropdown
    DataEditor.tsx      Hex/text/number data input
    DataPreview.tsx     Auto-parsed data interpretation
    CellTemplates.tsx   Template browser grid
    Toolbar.tsx         Action toolbar
    WalletConnect.tsx   Wallet + faucet + send controls
    TransactionFlow.tsx React Flow canvas
  store/
    sandbox.ts      Zustand store
  lib/
    ccc.ts          CCC client init, formatting
    cell.ts         Cell factory, chain loader, codegen
    script.ts       Known scripts registry
    templates.ts    Cell template definitions
    share.ts        URL serialization
  types/
    index.ts        TypeScript types
```
