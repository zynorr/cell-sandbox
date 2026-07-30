import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LearnWorkspace } from '../LearnWorkspace'

describe('LearnWorkspace', () => {
  it('teaches the Cell lifecycle without mounting editable raw fields', () => {
    render(<LearnWorkspace />)

    expect(screen.getByRole('heading', { name: 'State lives in Cells' })).toBeInTheDocument()
    expect(screen.getByText('completeInputsByCapacity(signer)', { exact: false })).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByText('Lock Script')).not.toBeInTheDocument()
  })
})
