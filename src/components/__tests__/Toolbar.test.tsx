import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { Toolbar } from '@/components/Toolbar'
import { useSandbox } from '@/store/sandbox'

describe('Toolbar', () => {
  beforeEach(() => {
    useSandbox.setState({
      loadOutpointInput: '',
      error: null,
      isLoading: false,
    })
  })

  it('keeps secondary tools hidden until requested', async () => {
    const user = userEvent.setup()
    render(<Toolbar />)

    expect(screen.getByRole('button', { name: 'New Cell' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Load an on-chain Cell')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copy Link' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'More tools' }))

    expect(screen.getByLabelText('Load an on-chain Cell')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy Link' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export Code' })).toBeInTheDocument()
  })
})
