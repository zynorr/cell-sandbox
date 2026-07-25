import { describe, expect, it } from 'vitest'
import { KNOWN_SCRIPTS } from '../script'

describe('KNOWN_SCRIPTS', () => {
  it('keeps protocol presets in their documented script roles', () => {
    const roles = Object.fromEntries(KNOWN_SCRIPTS.map((script) => [script.name, script.roles]))

    expect(roles['Secp256k1 Blake160 SighashAll']).toEqual(['lock'])
    expect(roles.Omnilock).toEqual(['lock'])
    expect(roles.Cheque).toEqual(['lock'])
    expect(roles.xUDT).toEqual(['type'])
    expect(roles['Spore v2']).toEqual(['type'])
    expect(roles['Nervos DAO']).toEqual(['type'])
    expect(roles['Type ID']).toEqual(['type'])
  })

  it('uses the published Pudge Cheque deployment', () => {
    const cheque = KNOWN_SCRIPTS.find((script) => script.name === 'Cheque')

    expect(cheque).toMatchObject({
      codeHash: '0x60d5f39efce409c587cb9ea359cefdead650ca128f0bd9cb3855348f98c70d5b',
      hashType: 'type',
      cellDep: {
        txHash: '0x7f96858be0a9d584b4a9ea190e0420835156a6010a5fde15ffcdc9d9c721ccab',
        index: 0,
        depType: 'depGroup',
      },
    })
  })
})
