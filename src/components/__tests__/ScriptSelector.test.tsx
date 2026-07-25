import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScriptSelector } from '../ScriptSelector'

const emptyScript = { codeHash: '', hashType: 'type' as const, args: '0x' }

describe('ScriptSelector', () => {
  it('shows only lock protocols in the lock picker', async () => {
    render(<ScriptSelector script={emptyScript} role="lock" onChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Select Script' }))

    expect(screen.getByText('Secp256k1 Blake160 SighashAll')).toBeInTheDocument()
    expect(screen.getByText('Omnilock')).toBeInTheDocument()
    expect(screen.queryByText('xUDT')).not.toBeInTheDocument()
    expect(screen.queryByText('Nervos DAO')).not.toBeInTheDocument()
  })

  it('shows only type protocols in the type picker', async () => {
    render(<ScriptSelector script={emptyScript} role="type" onChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Select Script' }))

    expect(screen.getByText('xUDT')).toBeInTheDocument()
    expect(screen.getByText('Spore v2')).toBeInTheDocument()
    expect(screen.getByText('Type ID')).toBeInTheDocument()
    expect(screen.queryByText('Always Success')).not.toBeInTheDocument()
  })
})
