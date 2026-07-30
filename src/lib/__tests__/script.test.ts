import { describe, expect, it } from 'vitest'
import { ccc } from '@ckb-ccc/ccc'
import { getClient } from '../ccc'
import { getKnownScriptById, getKnownScripts } from '../script'

describe('CCC-backed script presets', () => {
  it('keeps CCC protocols in their documented script roles', () => {
    const roles = Object.fromEntries(getKnownScripts('testnet').map((script) => [script.name, script.roles]))

    expect(roles['Secp256k1 Blake160 SighashAll']).toEqual(['lock'])
    expect(roles.Omnilock).toEqual(['lock'])
    expect(roles.xUDT).toEqual(['type'])
    expect(roles['Nervos DAO']).toEqual(['type'])
    expect(roles['Type ID']).toEqual(['type'])
  })

  it('resolves deployment values from CCC KnownScript', async () => {
    const expected = await getClient('testnet').getKnownScript(ccc.KnownScript.XUdt)
    const actual = getKnownScriptById(ccc.KnownScript.XUdt, 'testnet')

    expect(actual).toEqual({
      codeHash: expected.codeHash,
      hashType: expected.hashType,
      args: '0x',
    })
  })

  it('exposes a broader CCC registry without unsupported protocol constants', () => {
    const scripts = getKnownScripts('testnet')

    expect(scripts.length).toBeGreaterThanOrEqual(12)
    expect(scripts.some((script) => script.name === 'Cheque')).toBe(false)
    expect(scripts.every((script) => script.cccId.length > 0)).toBe(true)
  })
})
