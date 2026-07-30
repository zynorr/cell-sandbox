import { ccc } from '@ckb-ccc/ccc'
import type { CellState, NetworkMode, ScriptState } from '@/types'
import { getCellOccupiedCapacity } from './cellMetrics'
import { findKnownScript, getKnownScriptById, isKnownScript } from './script'

export const SECP256K1_BLAKE160_CODE_HASH =
  getKnownScriptById(ccc.KnownScript.Secp256k1Blake160).codeHash
export const NERVOS_DAO_CODE_HASH =
  getKnownScriptById(ccc.KnownScript.NervosDao).codeHash
export const NERVOS_DAO_DEPOSIT_DATA = '0x0000000000000000'
export const ALWAYS_SUCCESS_CODE_HASH =
  getKnownScriptById(ccc.KnownScript.AlwaysSuccess).codeHash
export const MAX_CELL_CAPACITY = (BigInt(1) << BigInt(64)) - BigInt(1)
export const WALLET_FILLABLE_LOCK_ISSUE =
  'Secp256k1 lock args must be 20 bytes. Leave them empty for the connected wallet in Build Tx, or paste 20-byte args for another recipient.'

function isHexBytes(value: string, expectedBytes?: number): boolean {
  if (!/^0x[0-9a-fA-F]*$/.test(value)) return false
  const digits = value.length - 2
  if (digits % 2 !== 0) return false
  return expectedBytes === undefined || digits === expectedBytes * 2
}

function hexByteLength(value: string): number {
  return (value.length - 2) / 2
}

export function isWalletFillableLock(
  lock: ScriptState,
  network: NetworkMode = 'testnet'
): boolean {
  return isKnownScript(lock, ccc.KnownScript.Secp256k1Blake160, network)
    && (!lock.args || lock.args === '0x')
}

export function getLockScriptIssue(lock: ScriptState, network: NetworkMode = 'testnet'): string | null {
  if (!isHexBytes(lock.codeHash, 32)) return 'Lock code hash must be 32 bytes of hex.'
  if (!isHexBytes(lock.args)) return 'Lock args must be even-length, 0x-prefixed hex.'

  const known = findKnownScript(lock, network)
  if (known && !known.roles.includes('lock')) return `${known.name} is a type script and belongs in the Type Script field.`
  if (known && known.hashType !== lock.hashType) return `${known.name} must use hash type "${known.hashType}".`
  if (known?.name === 'Omnilock' && hexByteLength(lock.args) < 21) {
    return 'Omnilock args require at least the 21-byte authentication field.'
  }
  if (
    isKnownScript(lock, ccc.KnownScript.Secp256k1Blake160, network) &&
    !isHexBytes(lock.args, 20)
  ) {
    return WALLET_FILLABLE_LOCK_ISSUE
  }
  return null
}

export function getLockScriptAdvisory(lock: ScriptState, network: NetworkMode = 'testnet'): string | null {
  if (isKnownScript(lock, ccc.KnownScript.AlwaysSuccess, network)) {
    return 'Design example only. Always Success lets anyone spend the Cell, so Build Tx blocks it from wallet funding.'
  }
  return null
}

export function getTypeScriptIssue(type: ScriptState, network: NetworkMode = 'testnet'): string | null {
  if (!isHexBytes(type.codeHash, 32)) return 'Type code hash must be 32 bytes of hex.'
  if (!isHexBytes(type.args)) return 'Type args must be even-length, 0x-prefixed hex.'

  const known = findKnownScript(type, network)
  if (known && !known.roles.includes('type')) return `${known.name} is a lock script and belongs in the Lock Script field.`
  if (known && known.hashType !== type.hashType) return `${known.name} must use hash type "${known.hashType}".`
  if (known?.name === 'xUDT') {
    const argsLength = hexByteLength(type.args)
    if (argsLength < 32 || (argsLength > 32 && argsLength < 36)) {
      return 'xUDT args require a 32-byte owner lock script hash, optionally followed by 4-byte flags and extension data.'
    }
  }
  if (known?.name === 'Type ID' && !isHexBytes(type.args, 32)) {
    return 'Type ID args must contain the 32-byte identity derived when the Cell is created.'
  }
  return null
}

export function getTypeScriptAdvisory(type: ScriptState | null, network: NetworkMode = 'testnet'): string | null {
  if (!type || !type.codeHash || findKnownScript(type, network)?.cccId === ccc.KnownScript.NervosDao) return null
  return 'Design example only. Build Tx currently sends plain CKB and fresh Nervos DAO deposits, not this type script.'
}

export function validateOutputCells(
  selections: Array<{ cell: CellState; index: number }>,
  network: NetworkMode = 'testnet'
): string[] {
  const issues: string[] = []

  for (const { cell, index } of selections) {
    const label = `Cell #${index}`

    if (!/^\d+$/.test(cell.capacity) || BigInt(cell.capacity) <= BigInt(0)) {
      issues.push(`${label} capacity must be a positive whole number of shannons.`)
    } else if (BigInt(cell.capacity) > MAX_CELL_CAPACITY) {
      issues.push(`${label} capacity exceeds the CKB Uint64 maximum.`)
    } else if (BigInt(cell.capacity) < getCellOccupiedCapacity(cell)) {
      issues.push(`${label} capacity is below its occupied capacity.`)
    }

    const lockIssue = getLockScriptIssue(cell.lock, network)
    if (lockIssue) issues.push(`${label}: ${lockIssue}`)
    if (getLockScriptAdvisory(cell.lock, network)) {
      issues.push(`${label}: Always Success is an anyone-can-spend testing lock and cannot be funded from Build Tx.`)
    }

    if (cell.type) {
      const typeIssue = getTypeScriptIssue(cell.type, network)
      if (typeIssue) issues.push(`${label}: ${typeIssue}`)

      const knownType = findKnownScript(cell.type, network)
      if (knownType?.name === 'xUDT' && isHexBytes(cell.data) && hexByteLength(cell.data) < 16) {
        issues.push(`${label}: xUDT data requires at least a 16-byte uint128 little-endian amount.`)
      }

      if (knownType?.cccId === ccc.KnownScript.NervosDao) {
        if (cell.type.hashType !== 'type' || cell.type.args !== '0x') {
          issues.push(`${label}: Nervos DAO type must use hash type "type" with empty args.`)
        }
        if (cell.data.toLowerCase() !== NERVOS_DAO_DEPOSIT_DATA) {
          issues.push(`${label}: A new Nervos DAO deposit must contain exactly 8 zero bytes (${NERVOS_DAO_DEPOSIT_DATA}).`)
        }
      } else if (!typeIssue && getTypeScriptAdvisory(cell.type, network)) {
        issues.push(`${label}: Build Tx currently sends plain CKB and fresh Nervos DAO deposits only. Use other type-script Cells in Design Cells.`)
      }
    }

    if (!isHexBytes(cell.data || '0x')) {
      issues.push(`${label} data must be even-length, 0x-prefixed hex.`)
    }
  }

  return issues
}
