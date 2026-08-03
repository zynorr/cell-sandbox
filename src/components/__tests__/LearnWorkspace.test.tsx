import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LearnWorkspace } from '../LearnWorkspace'

vi.mock('../CellProcessScene', () => ({
  CellProcessScene: () => <div data-testid="cell-process-scene" />,
}))

describe('LearnWorkspace', () => {
  it('teaches the Cell lifecycle progressively without mounting editable raw fields', async () => {
    render(<LearnWorkspace />)

    expect(screen.getByRole('heading', { name: 'State lives in Cells' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByText('Lock Script')).not.toBeInTheDocument()

    await userEvent.click(screen.getAllByRole('button', { name: /Code/ })[0])
    expect(screen.getByText('completeInputsByCapacity(signer)', { exact: false })).toBeInTheDocument()
  })
})
