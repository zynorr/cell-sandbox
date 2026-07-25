import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DataPreview } from '../DataPreview'
import type { ScriptState } from '@/types'

const xudtType: ScriptState = {
  codeHash: '0x25c29dc317811a6f6f3985a7a9ebc4838bd388d19d0feeecf0bcd60f6c0975bb',
  hashType: 'type',
  args: `0x${'0'.repeat(64)}`,
}

const daoType: ScriptState = {
  codeHash: '0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e',
  hashType: 'type',
  args: '0x',
}

const sporeType: ScriptState = {
  codeHash: '0x685a60219309029d01310311dba953d67029170ca4848a4ff638e57002130a0d',
  hashType: 'data1',
  args: `0x${'1'.repeat(64)}`,
}

const typeId: ScriptState = {
  codeHash: '0x00000000000000000000000000000000000000000000000000545950455f4944',
  hashType: 'type',
  args: `0x${'2'.repeat(64)}`,
}

const sporeData = '0x58000000100000001e000000340000000a000000746578742f706c61696e1200000074657374696e6720706c61696e20746578742000000021a30f2b2f4927dbd6fd3917990af0dbb868438f44184e84d515f9af84ae4861'

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

  it('decodes the official SporeData Molecule example', () => {
    render(<DataPreview type={sporeType} data={sporeData} capacity="21500000000" />)
    expect(screen.getByText('text/plain')).toBeInTheDocument()
    expect(screen.getByText('testing plain text')).toBeInTheDocument()
    expect(screen.getByText('88 bytes')).toBeInTheDocument()
    expect(screen.getByText('Spore ID')).toBeInTheDocument()
  })

  it('rejects raw text that is not a SporeData Molecule table', () => {
    render(<DataPreview type={sporeType} data="0x7b226e616d65223a2274657374227d" capacity="21500000000" />)
    expect(screen.getByText('Invalid SporeData')).toBeInTheDocument()
  })

  it('describes Type ID separately from testing locks', () => {
    render(<DataPreview type={typeId} data="0xdeadbeef" capacity="15000000000" />)
    expect(screen.getByText('Type identity')).toBeInTheDocument()
    expect(screen.getByText('4 bytes (app-defined)')).toBeInTheDocument()
  })
})
