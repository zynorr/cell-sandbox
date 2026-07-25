import { ccc } from '@ckb-ccc/ccc'
import type { CellState, NetworkMode } from '@/types'
import { getClient } from './ccc'
import { NERVOS_DAO_CODE_HASH } from './cellValidation'

export interface InspectedCell {
  index: number
  cell: CellState | null
  outPoint: { txHash: string; index: number } | null
  isCellbase?: boolean
  unresolvedReason?: string
}

export interface InspectedTransaction {
  txHash: string
  network: NetworkMode
  status: string
  blockNumber?: string
  inputCells: InspectedCell[]
  outputCells: InspectedCell[]
  inputCapacity: bigint
  outputCapacity: bigint
  fee: bigint | null
  cellDeps: number
  cellbaseInputs: number
  daoInputs: number
  unresolvedInputs: number
  explorerUrl: string
}

function getExplorerUrl(network: NetworkMode, txHash: string): string {
  const base = network === 'mainnet'
    ? 'https://explorer.nervos.org'
    : 'https://pudge.explorer.nervos.org'
  return `${base}/transaction/${txHash}`
}

function outputToCellState(
  output: ccc.CellOutput,
  data: unknown,
  outPoint?: { txHash: string; index: number }
): CellState {
  return {
    capacity: output.capacity.toString(),
    lock: {
      codeHash: output.lock.codeHash.toString(),
      hashType: output.lock.hashType as CellState['lock']['hashType'],
      args: output.lock.args.toString(),
    },
    type: output.type
      ? {
          codeHash: output.type.codeHash.toString(),
          hashType: output.type.hashType as CellState['lock']['hashType'],
          args: output.type.args.toString(),
        }
      : null,
    data: data?.toString() ?? '0x',
    dataMode: 'hex',
    ...(outPoint ? { outPoint } : {}),
  }
}

function outPointToPlain(outPoint: ccc.OutPoint): { txHash: string; index: number } {
  return {
    txHash: outPoint.txHash.toString(),
    index: Number(outPoint.index),
  }
}

export function isCellbaseOutPoint(outPoint: ccc.OutPoint): boolean {
  return outPoint.txHash === `0x${'0'.repeat(64)}` && outPoint.index === BigInt(0xffffffff)
}

export async function loadTransactionFromChain(
  txHash: string,
  network: NetworkMode
): Promise<InspectedTransaction | string> {
  try {
    const client = getClient(network)
    const response = await client.getTransaction(ccc.hexFrom(txHash))

    if (!response) return 'Transaction not found on this network.'

    const tx = response.transaction
    const outputCells: InspectedCell[] = tx.outputs.map((output, index) => {
      const outPoint = { txHash, index }
      return {
        index,
        outPoint,
        cell: outputToCellState(output, tx.outputsData[index], outPoint),
      }
    })

    const inputCells = await Promise.all(
      tx.inputs.map(async (input, index): Promise<InspectedCell> => {
        if (isCellbaseOutPoint(input.previousOutput)) {
          return { index, outPoint: null, cell: null, isCellbase: true }
        }

        const outPoint = outPointToPlain(input.previousOutput)

        try {
          const cell = input.cellOutput && input.outputData
            ? ccc.Cell.from({
                outPoint: input.previousOutput,
                cellOutput: input.cellOutput,
                outputData: input.outputData,
              })
            : await client.getCell(input.previousOutput)

          if (!cell) {
            return {
              index,
              outPoint,
              cell: null,
              unresolvedReason: 'Previous output could not be resolved.',
            }
          }

          return {
            index,
            outPoint,
            cell: outputToCellState(cell.cellOutput, cell.outputData, outPoint),
          }
        } catch {
          return {
            index,
            outPoint,
            cell: null,
            unresolvedReason: 'Input details are unavailable from the public RPC.',
          }
        }
      })
    )

    const inputCapacity = inputCells.reduce(
      (sum, item) => sum + BigInt(item.cell?.capacity ?? 0),
      BigInt(0)
    )
    const outputCapacity = outputCells.reduce(
      (sum, item) => sum + BigInt(item.cell?.capacity ?? 0),
      BigInt(0)
    )
    const cellbaseInputs = inputCells.filter((item) => item.isCellbase).length
    const daoInputs = inputCells.filter(
      (item) => item.cell?.type?.codeHash.toLowerCase() === NERVOS_DAO_CODE_HASH
    ).length
    const unresolvedInputs = inputCells.filter((item) => !item.cell && !item.isCellbase).length

    return {
      txHash,
      network,
      status: response.status,
      blockNumber: response.blockNumber?.toString(),
      inputCells,
      outputCells,
      inputCapacity,
      outputCapacity,
      fee: unresolvedInputs === 0 && cellbaseInputs === 0 && daoInputs === 0
        ? inputCapacity - outputCapacity
        : null,
      cellDeps: tx.cellDeps.length,
      cellbaseInputs,
      daoInputs,
      unresolvedInputs,
      explorerUrl: getExplorerUrl(network, txHash),
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return `Transaction load failed: ${msg}`
  }
}
