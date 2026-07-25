import { describe, expect, it } from 'vitest'
import { estimateOccupiedCapacity } from '../cellMetrics'
import { CELL_TEMPLATES } from '../templates'

describe('CELL_TEMPLATES protocol shapes', () => {
  it('gives every template Cell enough capacity for its serialized fields', () => {
    for (const template of CELL_TEMPLATES) {
      for (const cell of template.cells) {
        expect(BigInt(cell.capacity), template.name).toBeGreaterThanOrEqual(estimateOccupiedCapacity(cell))
      }
    }
  })

  it('uses the official SporeData Molecule table shape', () => {
    const spore = CELL_TEMPLATES.find((template) => template.id === 'spore-dob')?.cells[0]

    expect(spore?.type?.args).toHaveLength(66)
    expect(spore?.data.startsWith('0x58000000100000001e00000034000000')).toBe(true)
  })

  it('keeps xUDT decimals out of the on-chain amount encoding', () => {
    const xudt = CELL_TEMPLATES.find((template) => template.id === 'xudt-token')?.cells[0]

    expect(xudt?.type?.args).toHaveLength(66)
    expect(xudt?.data).toBe('0x00e87648170000000000000000000000')
  })
})
