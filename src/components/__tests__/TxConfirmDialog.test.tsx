import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TxConfirmDialog } from '@/components/TxConfirmDialog'
import { NERVOS_DAO_CODE_HASH, SECP256K1_BLAKE160_CODE_HASH } from '@/lib/cellValidation'
import { useSandbox } from '@/store/sandbox'
import type { CellState } from '@/types'

function cellWithArgs(args: string): CellState {
  return {
    capacity: '6100000000',
    lock: {
      codeHash: SECP256K1_BLAKE160_CODE_HASH,
      hashType: 'type',
      args,
    },
    type: null,
    data: '0x',
    dataMode: 'hex',
  }
}

describe('TxConfirmDialog', () => {
  beforeEach(() => {
    useSandbox.setState({
      cells: [cellWithArgs('0x')],
      txOutputs: [0],
      showConfirmDialog: true,
    })
  })

  it('blocks an output with incomplete secp256k1 lock args', () => {
    render(<TxConfirmDialog />)

    expect(screen.getByText('Fix the output before sending')).toBeInTheDocument()
    expect(screen.getByText(/Cell #0: Secp256k1 lock args must be 20 bytes/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fix output first' })).toBeDisabled()
  })

  it('allows confirmation once the output lock is complete', () => {
    useSandbox.setState({
      cells: [cellWithArgs(`0x${'1'.repeat(40)}`)],
    })

    render(<TxConfirmDialog />)

    expect(screen.queryByText('Fix the output before sending')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm & Send' })).toBeEnabled()
  })

  it('explains the exact data required for a new Nervos DAO deposit', () => {
    useSandbox.setState({
      cells: [{
        ...cellWithArgs(`0x${'1'.repeat(40)}`),
        capacity: '10200000000',
        type: { codeHash: NERVOS_DAO_CODE_HASH, hashType: 'type', args: '0x' },
        data: '0x',
      }],
    })

    render(<TxConfirmDialog />)

    expect(screen.getByText(
      'Cell #0: A new Nervos DAO deposit must contain exactly 8 zero bytes (0x0000000000000000).'
    )).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fix output first' })).toBeDisabled()
  })
})
