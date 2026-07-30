import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ccc } from '@ckb-ccc/ccc'
import { DataPreview } from '../DataPreview'
import { getKnownScriptById } from '@/lib/script'

const xudtType = getKnownScriptById(ccc.KnownScript.XUdt, 'testnet', `0x${'0'.repeat(64)}`)

const daoType = getKnownScriptById(ccc.KnownScript.NervosDao)

const typeId = getKnownScriptById(ccc.KnownScript.TypeId, 'testnet', `0x${'2'.repeat(64)}`)

describe('DataPreview', () => {
  it('shows exact plain CKB capacity and output data size', () => {
    render(<DataPreview type={null} data="0xdeadbeef" capacity="6100000000" />)
    expect(screen.getByText('61 CKB')).toBeInTheDocument()
    expect(screen.getByText('4 bytes')).toBeInTheDocument()
  })

  it('shows the exact raw xUDT uint128 amount without assuming decimals', () => {
    render(<DataPreview type={xudtType} data="0x00e87648170000000000000000000000" capacity="14300000000" />)
    expect(screen.getByText('100000000000')).toBeInTheDocument()
    expect(screen.getByText('Amount (uint128 LE)')).toBeInTheDocument()
    expect(screen.getByText('Placeholder (all zeroes)')).toBeInTheDocument()
  })

  it('does not lose precision for large xUDT amounts', () => {
    render(<DataPreview type={xudtType} data="0xffffffffffffffffffffffffffffffff" capacity="14300000000" />)
    expect(screen.getByText('340282366920938463463374607431768211455')).toBeInTheDocument()
  })

  it('requires at least 16 bytes for xUDT data', () => {
    render(<DataPreview type={xudtType} data="0xdead" capacity="14300000000" />)
    expect(screen.getByText('2 bytes; requires at least 16')).toBeInTheDocument()
  })

  it('distinguishes a fresh DAO deposit from a prepared withdrawal', () => {
    const { rerender } = render(<DataPreview type={daoType} data="0x0000000000000000" capacity="10200000000" />)
    expect(screen.getByText('Fresh deposit')).toBeInTheDocument()

    rerender(<DataPreview type={daoType} data="0x3930000000000000" capacity="10200000000" />)
    expect(screen.getByText('Withdrawal prepared')).toBeInTheDocument()
    expect(screen.getByText('#12345')).toBeInTheDocument()
  })

  it('rejects invalid fresh DAO data', () => {
    render(<DataPreview type={daoType} data="0x" capacity="10200000000" />)
    expect(screen.getByText('Invalid DAO data')).toBeInTheDocument()
    expect(screen.getByText('8 zero bytes')).toBeInTheDocument()
  })

  it('describes Type ID separately from testing locks', () => {
    render(<DataPreview type={typeId} data="0xdeadbeef" capacity="15000000000" />)
    expect(screen.getByText('Type identity')).toBeInTheDocument()
    expect(screen.getByText('4 bytes (app-defined)')).toBeInTheDocument()
  })
})
