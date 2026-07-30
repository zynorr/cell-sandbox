# Architecture

Cell Sandbox is a single-page Next.js application. Zustand holds local workspace state, CCC supplies CKB primitives and network metadata, and one server route proxies testnet faucet requests.

## Product Flow

```text
Learn (read-only model)
  -> Design Cells (advanced editing)
  -> Inspect Tx (committed state transitions)
  -> Build Tx (outputs + wallet completion)
```

Each workspace has one responsibility. Learn and Build intentionally do not mount the raw `CellEditor`.

## Data Flow

```text
User action -> React component -> Zustand action -> state update
                                      |
                                      +-> lib helper -> CCC client or signer
```

## Store

`useSandbox` composes four slices:

- `cellSlice`: Cell drafts, selection, templates, loading, sharing, and export.
- `uiSlice`: active workspace, network, guide, errors, and template visibility.
- `flowSlice`: indexes of draft Cells selected as transaction outputs.
- `walletSlice`: CCC signer metadata, balance, transaction completion, and sending.

Funding inputs are not stored as visual drafts. CCC and the active signer select live input Cells while completing a transaction.

## CCC Ownership

The application delegates protocol behavior to CCC wherever CCC provides it:

- `src/lib/script.ts` maps display metadata to `ccc.KnownScript`; CCC supplies network code hashes and hash types.
- `src/lib/cellMetrics.ts` uses `ccc.CellAny.occupiedSize` and `ccc.CellAny.capacityFree`.
- `walletSlice` constructs outputs with `ccc.Transaction.from`, calls `completeInputsByCapacity`, and calls `completeFeeBy`.
- Nervos DAO dependencies are added with `addCellDepsOfKnownScripts`.

Local validation explains product scope and malformed user input. It does not duplicate script execution or capacity serialization.

## Templates

`getCellTemplates(network)` creates templates from the active CCC deployment registry. A template is sendable only when Build Tx supports its complete operation. Design-only templates are examples and cannot be wallet-funded from Build Tx.

## Network Handling

The active network controls:

- CCC public client selection;
- known-script deployment values;
- Cell and transaction loading;
- wallet connection lifecycle;
- faucet visibility;
- explorer links.

Changing networks disconnects the active wallet before using the new client.

## Security

- Wallets retain key custody and perform signing.
- Share URLs are validated with Zod before restoring state.
- The app does not persist user Cell drafts on a server.
- Faucet credentials and upstream details remain in the server route.
- Mainnet remains visibly distinct from testnet.

## Verification Layers

Functional verification consists of TypeScript, ESLint, Vitest, production builds, and browser walkthroughs. Newcomer comprehension is a separate evidence layer documented in [USABILITY_TESTING.md](USABILITY_TESTING.md).
