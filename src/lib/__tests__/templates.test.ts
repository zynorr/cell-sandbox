import { describe, expect, it } from 'vitest'
import { ccc } from '@ckb-ccc/ccc'
import { getCellOccupiedCapacity } from '../cellMetrics'
import { getKnownScriptById } from '../script'
import { getCellTemplates } from '../templates'

describe('Cell template protocol shapes', () => {
  it('gives every template Cell enough capacity for its serialized fields', () => {
    for (const template of getCellTemplates('testnet')) {
      for (const cell of template.cells) {
        expect(BigInt(cell.capacity), template.name).toBeGreaterThanOrEqual(getCellOccupiedCapacity(cell))
      }
    }
  })

  it('keeps xUDT decimals out of the on-chain amount encoding', () => {
    const xudt = getCellTemplates('testnet').find((template) => template.id === 'xudt-token')?.cells[0]

    expect(xudt?.type?.args).toHaveLength(66)
    expect(xudt?.data).toBe('0x00e87648170000000000000000000000')
  })

  it('uses CCC deployments in every protocol template', () => {
    const templates = getCellTemplates('testnet')
    const xudt = templates.find((template) => template.id === 'xudt-token')?.cells[0]
    const omnilock = templates.find((template) => template.id === 'omnilock')?.cells[0]

    expect(xudt?.type?.codeHash).toBe(getKnownScriptById(ccc.KnownScript.XUdt).codeHash)
    expect(omnilock?.lock.codeHash).toBe(getKnownScriptById(ccc.KnownScript.OmniLock).codeHash)
  })

  it('resolves every visible template on mainnet', () => {
    expect(() => getCellTemplates('mainnet')).not.toThrow()
    expect(getCellTemplates('mainnet').map((template) => template.id)).toEqual(
      getCellTemplates('testnet').map((template) => template.id)
    )
  })
})
