import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DataPreview } from '../DataPreview'
import type { ScriptState } from '@/types'

const xudtType: ScriptState = {
  codeHash: '0x25c29dc317811a6f6f3985a7a9ebc4838bd388d19d0feeecf0bcd60f6c0975bb',
  hashType: 'type',
  args: '0x0000000000000000000000000000000000000000000000000000000000000000',
}

const daoType: ScriptState = {
  codeHash: '0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e',
  hashType: 'type',
  args: '0x',
}

const sporeType: ScriptState = {
  codeHash: '0x685a60219309029d01310311dba953d67029170ca4848a4ff638e57002130a0d',
  hashType: 'data1',
  args: '0x',
}

const alwaysSuccessType: ScriptState = {
  codeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  hashType: 'data',
  args: '0x',
}

describe('DataPreview', () => {
  describe('plain CKB (no type script)', () => {
    it('shows capacity value and empty data', () => {
      render(<DataPreview type={null} data="0x" capacity="6100000000" />)
      expect(screen.getByText('61 CKB')).toBeInTheDocument()
      expect(screen.getByText('Empty')).toBeInTheDocument()
    })

    it('shows data byte count when data is present', () => {
      render(<DataPreview type={null} data="0xdeadbeef" capacity="6100000000" />)
      expect(screen.getByText('4 bytes')).toBeInTheDocument()
    })
  })

  describe('xUDT token parsing', () => {
    it('parses 1000.00 xUDT tokens (16-byte LE uint128)', () => {
      render(<DataPreview type={xudtType} data="0x00e87648170000000000000000000000" capacity="14200000000" />)
      expect(screen.getByText('1,000.00')).toBeInTheDocument()
      expect(screen.getByText(/Token Amount/)).toBeInTheDocument()
    })

    it('parses 0 tokens', () => {
      render(<DataPreview type={xudtType} data="0x00000000000000000000000000000000" capacity="14200000000" />)
      expect(screen.getByText('0.00')).toBeInTheDocument()
    })

    it('warns on data too short', () => {
      render(<DataPreview type={xudtType} data="0xdead" capacity="14200000000" />)
      expect(screen.getByText('2 bytes')).toBeInTheDocument()
    })
  })

  describe('DAO deposit parsing', () => {
    it('shows deposit cell status for empty data', () => {
      render(<DataPreview type={daoType} data="0x" capacity="10200000000" />)
      expect(screen.getByText('No data yet (fresh deposit)')).toBeInTheDocument()
    })

    it('parses deposited block number from 8-byte LE uint64', () => {
      render(<DataPreview type={daoType} data="0x3930000000000000" capacity="10200000000" />)
      expect(screen.getByText('#12345')).toBeInTheDocument()
    })

    it('parses block number 0 as fresh deposit', () => {
      render(<DataPreview type={daoType} data="0x0000000000000000" capacity="10200000000" />)
      expect(screen.getByText('#0')).toBeInTheDocument()
    })
  })

  describe('Spore DOB v2 parsing', () => {
    it('parses content from Spore molecule data', () => {
      const json = '{"name": "test"}'
      const size = 4 + json.length
      const sizeBytes = new Uint8Array([size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xff, (size >> 24) & 0xff])
      const contentBytes = new TextEncoder().encode(json)
      const combined = new Uint8Array(sizeBytes.length + contentBytes.length)
      combined.set(sizeBytes)
      combined.set(contentBytes, sizeBytes.length)
      const hex = '0x' + Array.from(combined).map(b => b.toString(16).padStart(2, '0')).join('')

      render(<DataPreview type={sporeType} data={hex} capacity="18000000000" />)
      expect(screen.getByText((c) => c.includes('name') && c.includes('test'))).toBeInTheDocument()
    })

    it('handles very short data', () => {
      render(<DataPreview type={sporeType} data="0xdead" capacity="18000000000" />)
      expect(screen.getByText('2 bytes')).toBeInTheDocument()
    })
  })

  describe('Always Success / testing type', () => {
    it('shows testing/demo label', () => {
      render(<DataPreview type={alwaysSuccessType} data="0x" capacity="6100000000" />)
      expect(screen.getByText('Testing / demo')).toBeInTheDocument()
      expect(screen.getByText('Empty')).toBeInTheDocument()
    })
  })
})
