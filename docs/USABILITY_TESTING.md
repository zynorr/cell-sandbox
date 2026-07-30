# Newcomer Usability Testing

Automated checks establish functional correctness. They do not show whether a developer who is new to CKB can understand the Cell model or complete the workflow. This protocol records that separate evidence.

## Evidence Status

No moderated newcomer sessions have been recorded yet. Do not describe the product as usability-validated until completed sessions and findings are added below.

## Participants

Recruit 3 to 5 developers who:

- have not built a CKB application;
- are comfortable reading TypeScript;
- have used a browser wallet before;
- did not contribute to Cell Sandbox.

Record only role and relevant experience. Do not collect wallet addresses, private keys, seed phrases, or other identifying wallet data.

## Moderator Script

1. Say: "Please think aloud. I am testing the interface, not you. I will not explain CKB concepts unless you become fully blocked."
2. Start a screen recording only with the participant's consent.
3. Give one task at a time without pointing to controls.
4. Record time, wrong turns, questions, and whether help was required.
5. After each task, ask: "What do you think happened?"

## Tasks

| Task | Starting point | Success condition | Target |
| --- | --- | --- | --- |
| Explain a Cell | Learn | Participant can state that transactions consume existing Cells and create new Cells. | 2 minutes, no help |
| Find ownership | Learn | Participant identifies the lock script as the spending condition. | 1 minute, no help |
| Design a transfer output | Design Cells | Participant applies the CKB Transfer template and identifies capacity and lock args. | 3 minutes, at most 1 wrong turn |
| Inspect a transaction | Inspect Tx | Participant loads the multi-input sample and identifies consumed inputs and created outputs. | 3 minutes, no help |
| Prepare Build Tx | Build Tx | Participant selects an output and explains that the wallet supplies live funding inputs. | 3 minutes, no help |
| Review a send | Build Tx | On testnet, participant connects a wallet and reaches transaction review without broadcasting unless they choose to. | 5 minutes, at most 1 help request |

## Session Record

Create one row per participant. Leave unknown values blank rather than estimating them.

| Participant | CKB experience | Tasks completed | Time to first correct action | Wrong turns | Help requests | Main confusion | Date |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| Pending | None recorded | | | | | | |

## Exit Questions

Use a 1 to 5 scale, followed by a short explanation:

1. How confident are you that you can explain what a Cell is?
2. How clear was the difference between a designed Cell and a transaction output?
3. How clear was the source of transaction inputs?
4. Which screen required the most effort?
5. What would you remove or rename?

## Release Gate

Before claiming newcomer usability validation:

- at least 3 eligible participants must complete the protocol;
- at least 80% of core tasks must be completed without moderator explanation;
- no participant may mistake a designed draft for a live on-chain Cell after the Build task;
- repeated confusion reported by 2 or more participants must be tracked as an issue or fixed;
- the anonymized results and resulting changes must be linked from the weekly update.

Run `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, and `pnpm build` separately. Those commands remain engineering verification, not usability evidence.
