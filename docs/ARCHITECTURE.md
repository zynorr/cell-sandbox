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
├── flowSlice   → transaction output selections
└── walletSlice → address, balance, connected, sendTransaction, etc.
```

### Slice details

**cellSlice** — CRUD for cell designs. Cells are held in an array with numeric IDs. `createFromTemplate` loads a template's cells. `loadFromChain` fetches a real cell from CKB and adds it to the editor.

**uiSlice** — UI state: which view is active (builder/flow), which panels are open, which cell is selected, the active network (testnet/mainnet).

**flowSlice** — Transaction flow state for designed Cells selected as new outputs. Funding inputs are deliberately absent from UI state because the active wallet selects live, spendable Cells while completing the transaction.

**walletSlice** — Selected CCC signer state, balance fetching, placeholder output-lock hydration, output validation, network-aware cell deps, transaction completion, and sending. Wallet discovery and connection are handled by the CCC React connector.

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
- **Wallet signer** — selected by `@ckb-ccc/connector-react` and bridged into `walletSlice`; network changes disconnect it before the client changes
- **Cell loader** — `loadCellFromChain` passes network to the client
- **Toolbar** — placeholder text shows current network
- **Faucet** — hidden on mainnet with a "Switch to testnet" prompt
- **Explorer links** — generated per network

### 3. Script Registry
`src/lib/script.ts` maintains a role-aware registry of known CKB lock and type scripts with their Pudge code hashes, hash types, and optional cell deps. Role filtering prevents protocol type scripts from appearing as lock presets and vice versa.

### 4. Template System
Templates in `src/lib/templates.ts` define pre-built Cell configurations as plain data objects. Build templates can become transaction outputs; design-only examples return to the editor. Applying any template replaces the workspace and clears stale flow selections.

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
type ViewMode = 'learn' | 'design' | 'inspect' | 'build'
```

---

## Security Considerations

- **Faucet API key** is server-side only (Vercel edge function)
- **Share URLs** are Zod-validated on deserialization to prevent XSS
- **No server-side storage** — all user data stays in the browser
- **Connected wallets** handle key management and signing; the app never touches private keys
