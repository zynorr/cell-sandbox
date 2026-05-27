# Architecture

Cell Sandbox is a **single-page Next.js application** with a Zustand store, server-side API route for the faucet proxy, and zero external backend dependencies.

---

## Data Flow

```
User Action → React Component → Zustand Store Action → State Update → Re-render
                                    │
                                    ▼
                               Pure Functions
                              (lib/ helpers)
                                    │
                                    ▼
                               CCC SDK
                           (chain interaction)
```

### Key principle
Components never talk directly to the chain or manipulate raw data. All business logic lives in `src/lib/` as pure functions. Components dispatch store actions, which call lib functions and update state.

---

## Store Architecture

The Zustand store is composed from four independent slices:

```
useSandbox (src/store/sandbox.ts)
├── cellSlice    → cells[], addCell, updateCell, removeCell, resetCells
├── uiSlice     → viewMode, showTemplates, showExport, network, etc.
├── flowSlice   → inputs[], outputs[], cellDeps[], witnesses, etc.
└── walletSlice → address, balance, connected, sendTransaction, etc.
```

### Slice details

**cellSlice** — CRUD for cell designs. Cells are held in an array with numeric IDs. `createFromTemplate` loads a template's cells. `loadFromChain` fetches a real cell from CKB and adds it to the editor.

**uiSlice** — UI state: which view is active (builder/flow), which panels are open, which cell is selected, the active network (testnet/mainnet).

**flowSlice** — Transaction flow state: which cells are assigned as inputs/outputs, cell deps gathered from scripts, and witness placeholders.

**walletSlice** — Wallet connection lifecycle: connect/disconnect, balance fetching, transaction building and sending, faucet claiming.

---

## Component Tree

```
<App>
  ├── <header>          Network badge, view toggle, title
  ├── <Toolbar>         New Cell, Copy Link, Export, Templates, Load
  ├── <aside>
  │   ├── <CellView>    SVG representation of each cell
  │   └── <CellEditor>  Form fields for selected cell
  │       ├── <ScriptSelector>   Known script picker
  │       └── <DataEditor>       Hex/text/number input
  ├── <main>
  │   ├── <DataPreview>          Auto-parsed data interpretation
  │   └── <TransactionFlow>      React Flow canvas (if flow view)
  ├── <CellTemplates>            Modal/grid of templates
  ├── <TxConfirmDialog>          Transaction confirmation modal
  └── <WalletConnect>            Connect, faucet, send controls
```

---

## Key Design Decisions

### 1. CCC Client Caching
`src/lib/ccc.ts` caches CCC clients per network in a `Map`. This avoids re-creating RPC connections on every interaction and allows seamless network switching.

### 2. Network-Aware Everything
The `network` state lives in `uiSlice` and flows through:
- **CCC client** — creates the right `ClientPublicTestnet` / `ClientPublicMainnet`
- **Wallet signer** — JoyID signer cached per network
- **Cell loader** — `loadCellFromChain` passes network to the client
- **Toolbar** — placeholder text shows current network
- **Faucet** — hidden on mainnet with a "Switch to testnet" prompt
- **Explorer links** — generated per network

### 3. Script Registry
`src/lib/script.ts` maintains a registry of known CKB scripts with their code hashes, hash types, and optional cell deps. This registry is the single source of truth for script selection throughout the UI.

### 4. Template System
Templates in `src/lib/templates.ts` define pre-built cell configurations as plain data objects. Each template specifies a category, color theme, and whether it's sendable (realistic) or just for design exploration.

### 5. URL Sharing
`src/lib/share.ts` serializes cell state arrays to base64-encoded JSON query parameters. Deserialization runs through Zod validation to reject malformed or malicious payloads.

### 6. Faucet Proxy
The API route at `src/app/api/faucet/route.ts` proxies requests to the CKB testnet faucet service, keeping the faucet API key and URL server-side.

---

## State Shape (TypeScript)

```typescript
interface CellState {
  capacity: string         // CKB shannons as string (e.g. "6100000000")
  lock: ScriptState        // Lock script
  type: ScriptState | null // Optional type script
  data: string             // Hex-encoded data
  dataMode: 'hex' | 'text' | 'number'
  outPoint?: { txHash: string; index: number }
}

interface ScriptState {
  codeHash: string
  hashType: 'type' | 'data' | 'data1' | 'data2'
  args: string
}

type NetworkMode = 'testnet' | 'mainnet'
type ViewMode = 'builder' | 'flow'
```

---

## Security Considerations

- **Faucet API key** is server-side only (Vercel edge function)
- **Share URLs** are Zod-validated on deserialization to prevent XSS
- **No server-side storage** — all user data stays in the browser
- **JoyID** handles key management; the app never touches private keys
