import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { CellTemplates } from '@/components/CellTemplates'
import { useSandbox } from '@/store/sandbox'
import { defaultWallet } from '@/store/slices/walletSlice'

describe('CellTemplates in Build Tx', () => {
  beforeEach(() => {
    useSandbox.setState({
      showTemplates: true,
      viewMode: 'build',
      txOutputs: [0],
      wallet: { ...defaultWallet },
    })
  })

  it('replaces prior flow selections and makes a build template an output', async () => {
    const user = userEvent.setup()
    render(<CellTemplates />)

    await user.click(screen.getByRole('button', { name: /CKB Transfer/ }))

    expect(useSandbox.getState().txOutputs).toEqual([0])
    expect(useSandbox.getState().cells[0].capacity).toBe('6200000000')
  })

  it('opens Design Cells for a design-only example', async () => {
    const user = userEvent.setup()
    render(<CellTemplates />)

    await user.click(screen.getByRole('button', { name: /Always Success/ }))

    expect(useSandbox.getState().viewMode).toBe('design')
    expect(useSandbox.getState().txOutputs).toEqual([])
  })
})
