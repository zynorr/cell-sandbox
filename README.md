# Cell Sandbox 

> A visual playground for the **Nervos CKB Cell Model** — design cells, build transactions, and broadcast to testnet/mainnet, all from your browser.


**🔗 [Live Demo]((https://cell-sandbox-m.vercel.app/)) ·

---

##  Features

###  Visual Cell Designer
Design CKB cells with an intuitive form-based editor:
- **Capacity** — set CKB amounts with automatic shannon conversion
- **Lock Script** — pick from known scripts (Secp256k1, Omnilock, Always Success) or paste custom code hashes
- **Type Script** — optionally attach type scripts (xUDT, Spore, DAO, etc.)
- **Data** — switch between hex, text, and number modes; data auto-interprets in preview

###  Cell Templates
Pre-built cell configurations covering the most common CKB patterns:
| Template | Category | Description |
|---|---|---|
| **Simple Transfer** | `token` | Send CKB with secp256k1 lock (sendable) |
| **xUDT Token** | `token` | Fungible token with xUDT type script |
| **Spore DOB v2** | `nft` | Digital object with Spore Protocol |
| **DAO Deposit** | `dao` | Stake CKB in Nervos DAO (sendable) |
| **Omnilock Account** | `auth` | ETH/BTC/Doge compatible lock |
| **Always Success** | `demo` | No-validation test cell (sendable) |

###  Transaction Flow
Visual transaction builder powered by [React Flow](https://reactflow.dev):
- Drag-and-drop assignment of cells as **inputs** and **outputs**
- Real-time **capacity balance** tracking
- **Fee estimation** for transaction viability
- **Cell deps** auto-populated from script selections

###  Wallet & On-Chain
Full end-to-end on-chain interaction:
- **JoyID** — connect with passkey-based wallet (WebAuthn)
- **Faucet** — claim 10,000 testnet CKB with one click
- **Send Tx** — sign with JoyID, broadcast to chain, get explorer link
- **Load from Chain** — fetch real cells by outpoint `txHash:index`
- **Network Switch** — toggle between Pudge testnet and mainnet with one click

###  Export & Share
- **Code Export** — generate CCC-compatible TypeScript from your cell designs
- **Share URLs** — encode entire cell configurations into shareable links
- **Data Preview** — auto-parses xUDT amounts, DAO deposit blocks, and Spore content

---

## Quick Start

```bash
pnpm install
pnpm dev
```

Open **[http://localhost:3000](http://localhost:3000)**.

### Try the Full Flow

1. Connect **JoyID** wallet (top-right sidebar)
2. Click **Get 10,000 CKB from Faucet**
3. Open **Templates** → **Simple Transfer**
4. Switch to **Tx Flow** view, mark cell as output
5. Click **Send Tx** → sign in JoyID
6. Copy the explorer link to verify on-chain

---

##  Project Structure

```
src/
├── app/
│   ├── api/faucet/route.ts    # Faucet proxy (server-side)
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main application page
├── components/
│   ├── CellView.tsx           # SVG cell visualization
│   ├── CellEditor.tsx         # Cell property editor
│   ├── CellTemplates.tsx      # Template browser grid
│   ├── DataEditor.tsx         # Hex/text/number data input
│   ├── DataPreview.tsx        # Auto-parsed data interpretation
│   ├── ScriptSelector.tsx     # Known script picker dropdown
│   ├── Toolbar.tsx            # Action toolbar
│   ├── TransactionFlow.tsx    # React Flow canvas
│   ├── TxConfirmDialog.tsx    # Transaction confirmation modal
│   └── WalletConnect.tsx      # Wallet + faucet + send controls
├── lib/
│   ├── ccc.ts                 # CCC client init & helpers
│   ├── cell.ts                # Cell factory, chain loader, codegen
│   ├── schemas.ts             # Zod validation schemas
│   ├── script.ts              # Known script registry
│   ├── share.ts               # URL serialization/deserialization
│   └── templates.ts           # Cell template definitions
├── store/
│   ├── slices/
│   │   ├── cellSlice.ts       # Cell state (create/update/delete)
│   │   ├── flowSlice.ts       # Transaction flow state
│   │   ├── uiSlice.ts         # UI state (templates, layout)
│   │   └── walletSlice.ts     # Wallet connection & tx sending
│   └── sandbox.ts             # Zustand store composition
├── types/
│   └── index.ts               # TypeScript type definitions
└── test/
    └── setup.ts               # Test environment setup
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js](https://nextjs.org) 16 (App Router) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) v4 |
| **State** | [Zustand](https://github.com/pmndrs/zustand) |
| **Flow Canvas** | [React Flow](https://reactflow.dev) / `@xyflow/react` |
| **CKB SDK** | [CCC](https://github.com/ckb-devrel/ccc) (`@ckb-ccc/ccc`) |
| **Wallet** | [JoyID](https://joyid.dev) (`@ckb-ccc/shell`) |
| **Validation** | [Zod](https://zod.dev) |
| **Testing** | [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) |
| **Deployment** | [Vercel](https://vercel.com) |

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run test suite |
| `pnpm test:watch` | Run tests in watch mode |

---

##  Testing

```bash
pnpm test          # Run all tests
pnpm test:watch    # Watch mode
```

The test suite covers:
- **Data Preview** — correct parsing of xUDT amounts, DAO data, Spore content
- **Data Editor** — hex ↔ text ↔ number mode conversion
- **Schema Validation** — cell state and outpoint validation with Zod
- **URL Serialization** — encode/decode cell states to shareable URLs

---


**Why Cell Sandbox?**
- Lowers the barrier to entry for CKB development
- Provides instant visual feedback for the cell model
- Enables rapid prototyping without writing code
- Bridges the gap between learning and building on CKB

---

## 📚 Docs

| Document | Description |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Data flow, store design, component tree, key decisions |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Dev setup, workflow, testing, troubleshooting |

See also [`CONTRIBUTING.md`](CONTRIBUTING.md) for how to contribute.

## 📄 License

MIT — see [LICENSE](LICENSE) for details.
