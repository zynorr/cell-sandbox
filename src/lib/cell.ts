import { ccc } from '@ckb-ccc/ccc'
import type { CellState } from '@/types'
import { getClient } from './ccc'

export function emptyCell(): CellState {
  return {
    capacity: '10000000000',
    lock: { codeHash: '', hashType: 'type', args: '' },
    type: null,
    data: '0x',
    dataMode: 'hex',
  }
}

export async function loadCellFromChain(
  txHash: string,
  index: number,
  network?: 'testnet' | 'mainnet'
): Promise<CellState | string> {
  try {
    const client = getClient(network)
    const outPoint = ccc.OutPoint.from({
      txHash: ccc.hexFrom(txHash),
      index: ccc.numFrom(index),
    })
    const cell = await client.getCell(outPoint)
    if (!cell) return 'Cell not found on chain'

    const output = cell.cellOutput
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
      data: cell.outputData?.toString() ?? '0x',
      dataMode: 'hex',
      outPoint: { txHash, index },
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return `Load failed: ${msg}`
  }
}

export function generateExportCode(cells: CellState[]): string {
  const lines: string[] = [
    "import { ccc } from '@ckb-ccc/ccc'",
    '',
    'const tx = ccc.Transaction.from({',
    '  outputs: [',
  ]

  for (const cell of cells) {
    const lockCode = cell.lock.codeHash || '0x0000...'
    const lockArgs = cell.lock.args || '0x'
    const typeSection = cell.type
      ? `      type: ccc.Script.from({
        codeHash: ccc.hexFrom('${cell.type.codeHash}'),
        hashType: '${cell.type.hashType}',
        args: ccc.hexFrom('${cell.type.args || '0x'}'),
      }),\n`
      : ''

    lines.push(`    {
      capacity: ccc.fixedPointFrom(${Number(cell.capacity) / 1e8}),
      lock: ccc.Script.from({
        codeHash: ccc.hexFrom('${lockCode}'),
        hashType: '${cell.lock.hashType}',
        args: ccc.hexFrom('${lockArgs}'),
      }),${typeSection ? `\n${typeSection}` : ''}
    },`)
  }

  lines.push('  ],')
  lines.push('})')
  lines.push('')
  lines.push('await tx.completeInputsByCapacity(signer)')
  lines.push("await tx.completeFeeBy(signer, 1000)")
  lines.push('const txHash = await signer.sendTransaction(tx)')
  lines.push('console.log("Transaction sent:", txHash)')

  return lines.join('\n')
}
