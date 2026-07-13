# Cell Sandbox

Cell Sandbox is a visual learning and prototyping workspace for the Nervos CKB Cell model. It helps developers understand how Cells store state, how transactions consume live input Cells and create new output Cells, and how a visual configuration maps back to CCC-compatible TypeScript.

Live Demo: https://cell-sandbox-m.vercel.app/

## CKB Vocabulary Used

The UI copy follows the official CKB docs vocabulary:

- A Cell is the base structure for storing state on CKB.
- Capacity is the Cell's storage limit and CKB amount, denominated in shannons.
- A lock script is the ownership rule that decides when a Cell can be spent.
- A type script is an optional state-transition rule.
- A transaction consumes live input Cells and creates new output Cells.

References: [Cell](https://docs.nervos.org/docs/tech-explanation/cell), [Script](https://docs.nervos.org/docs/tech-explanation/script), and [Transaction](https://docs.nervos.org/docs/tech-explanation/transaction).

## Milestone 1 Learning Flow

The app is organized around four workspace modes:

| Mode | Purpose |
| --- | --- |
| Learn | Start with the Cell mental model: capacity, lock script, type script, and data. |
| Design Cells | Create a draft Cell, use templates, or load one on-chain Cell by outpoint. |
| Inspect Tx | Paste a full transaction hash and compare live input Cells consumed with new output Cells created. |
| Build Tx | Mark draft Cells as outputs to create, then let the wallet supply funding inputs when sending. |

The interface includes:

- A visible How to Use guide
- A Start Here panel for first-time users
- Inline explanations beside technical Cell fields
- Clearer empty, loading, partial, and error states
- A transaction inspector that separates live input Cells consumed from new output Cells created
- A bottom status strip showing the active state and next useful action

## Screenshots

| Learn / Start | Build Tx Output | Mobile Build Tx |
| --- | --- | --- |
| ![Learn screen](docs/screenshots/milestone-1-learn-desktop.png) | ![Build Tx with output selected](docs/screenshots/milestone-1-build-output-desktop.png) | ![Mobile Build Tx](docs/screenshots/milestone-1-build-mobile.png) |

## Features

### Visual Cell Designer

- Edit capacity in shannons with a CKB preview and occupied/free estimates
- Choose known lock and type scripts or paste custom script fields
- Edit data in hex, text, or number modes
- Preview common data patterns such as xUDT amounts, DAO data, and Spore content

### Cell Templates

Pre-built Cell configurations cover common CKB patterns:

| Template | Category | Description |
| --- | --- | --- |
| Simple Transfer | token | Send CKB with secp256k1 lock |
| xUDT Token | token | Fungible token Cell design |
| Spore DOB v2 | nft | Digital object Cell design |
| DAO Deposit | dao | Nervos DAO deposit Cell |
| Omnilock Account | auth | Omnilock Cell design |
| Always Success | demo | Test Cell with always-success lock |

### Transaction Inspection

The Inspect Tx workspace loads a transaction by hash and shows:

- Transaction status and block number
- Live input Cells consumed
- New output Cells created
- Capacity flow and fee when all inputs resolve
- Cell dep count
- Explorer link for verification
- Partial input resolution when public RPC data is incomplete

### Transaction Flow Builder

The Build Tx workspace uses React Flow to show a transaction as a state transition:

- Mark local draft Cells as output Cells to create
- Use manual inputs only when modeling live Cells being consumed
- Let the connected wallet supply funding inputs at send time
- Send transactions through the connected wallet

### Wallet and On-Chain Actions

- JoyID wallet connection
- Testnet faucet request
- Transaction signing and broadcasting
- Network switch between Pudge testnet and mainnet
- On-chain Cell loading by outpoint

### Export and Share

- Copy CCC-compatible TypeScript code
- Copy shareable URLs for Cell configurations
- Restore shared Cell state from URL parameters

## Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

If pnpm asks about approved native builds, approve the listed packages and run install again:

```bash
pnpm approve-builds --all
pnpm install
```

## Try the Guided Flow

1. Open the app and start in Learn.
2. Click How to Use or follow the Start Here panel.
3. Move to Design Cells and create or load a draft Cell.
4. Move to Build Tx.
5. Click the green Output button under the Cell to make it a transaction output.
6. Connect JoyID to send on testnet, or read the wallet panel explanation if no wallet is connected.

## Reviewer Walkthrough

From a fresh page load:

| Step | What to check |
| --- | --- |
| Learn | The default workspace explains capacity, lock script, type script, and data before asking for code. |
| Design | The editor describes the selected Cell as a local draft with capacity, ownership, optional state rules, and data. |
| Build Tx | The Build Tx guide explains that draft Cells are not outputs until marked. |
| Mark Output | Clicking Output changes the flow to `0 in / 1 out`, shows the output Cell on the right, and marks wallet inputs as auto-funded at send. |
| Connect / Send | The wallet panel explains that JoyID signs testnet transactions; once connected, sending requires at least one selected output and uses wallet-funded inputs. |

## How to Verify

Reviewers can verify Milestone 1 locally or in the deployed demo:

| Deliverable | Verification |
| --- | --- |
| Guided learning flow | Open the app and confirm the default workspace starts on Learn with Start Here and How to Use visible. |
| Clear module structure | Confirm the top navigation has Learn, Design Cells, Inspect Tx, and Build Tx. |
| Cell field explanations | Open Design Cells and confirm capacity, lock, type, and data fields include helper explanations. |
| Full transaction inspection | Open Inspect Tx and click Open sample Pudge transaction, or paste `0xcfad00f9954110b0fc28f850c8c8b7bc7191fd276bdcb43ba1fbff3d8f3b1507`. |
| Input/output Cell display | Confirm the loaded transaction separates Input Cells Consumed from Output Cells Created. |
| Empty/loading/error states | Try an invalid hash such as `0x1234` and confirm the validation message appears. |
| Capacity education | Confirm the editor and bottom status strip show occupied/free capacity estimates. |
| Responsive layout | Open the app around 390px width and confirm the same Learn / Design / Inspect / Build model remains usable. |

## Project Structure

```text
src/
  app/
    api/faucet/route.ts       Faucet proxy
    globals.css               Global styles
    layout.tsx                Root layout
    page.tsx                  Main workspace shell
  components/
    CellConceptPanel.tsx      Educational Cell model panel
    CellEditor.tsx            Cell property editor
    CellTemplates.tsx         Template browser
    CellView.tsx              SVG Cell visualization
    DataEditor.tsx            Hex/text/number data input
    DataPreview.tsx           Data interpretation panel
    GuidePanel.tsx            How to Use guide
    ScriptSelector.tsx        Known script picker
    StartHerePanel.tsx        First-use learning steps
    Toolbar.tsx               Cell actions and outpoint loader
    TransactionFlow.tsx       React Flow transaction builder
    TransactionInspector.tsx  Full transaction hash inspector
    TxConfirmDialog.tsx       Send confirmation dialog
    WalletConnect.tsx         Wallet, faucet, and send controls
    WorkspaceStatus.tsx       Bottom status and next-step strip
  lib/
    ccc.ts                    CCC client helpers
    cell.ts                   Cell factory, loader, and codegen
    schemas.ts                Zod validation schemas
    script.ts                 Known script registry
    share.ts                  URL serialization
    templates.ts              Cell template definitions
    transaction.ts            Transaction hash loader
  store/
    slices/                   Zustand store slices
    sandbox.ts                Store composition
  types/
    index.ts                  Shared TypeScript types
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Flow Canvas | React Flow / `@xyflow/react` |
| CKB SDK | CCC / `@ckb-ccc/ccc` |
| Wallet | JoyID via CCC shell |
| Validation | Zod |
| Testing | Vitest and Testing Library |
| Deployment | Vercel |

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest |
| `pnpm test:watch` | Run tests in watch mode |

## Testing

```bash
pnpm test
pnpm lint
pnpm build
```

The existing test suite covers data preview parsing, data editor conversions, schema validation, and share URL serialization.

## Docs

| Document | Description |
| --- | --- |
| `docs/ARCHITECTURE.md` | Data flow, store design, component tree, and design decisions |
| `docs/DEVELOPMENT.md` | Local setup, workflow, testing, and troubleshooting |

See `CONTRIBUTING.md` for contribution details.

## License

MIT. See `LICENSE` for details.
