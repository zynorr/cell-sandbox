import { z } from 'zod'

// ── Cell State Schemas (for share URL deserialization) ──

export const scriptSchema = z.object({
  codeHash: z.string(),
  hashType: z.enum(['type', 'data', 'data1', 'data2']),
  args: z.string(),
})

export const cellStateSchema = z.object({
  capacity: z.string(),
  lock: scriptSchema,
  type: scriptSchema.nullable(),
  data: z.string(),
  dataMode: z.enum(['hex', 'text', 'number']),
  outPoint: z
    .object({
      txHash: z.string(),
      index: z.number(),
    })
    .optional(),
})

export const cellStateArraySchema = z.array(cellStateSchema)

// ── Outpoint Schema (for txHash:index input) ──

const hexRegex = /^0x[0-9a-fA-F]+$/

export const outpointSchema = z.string().transform((val, ctx) => {
  const parts = val.split(':')
  if (parts.length !== 2) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Format: txHash:index (e.g. 0xabcd...:0)' })
    return z.NEVER
  }
  const [txHash, indexStr] = parts
  if (!hexRegex.test(txHash)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'txHash must be a valid 0x-prefixed hex string' })
    return z.NEVER
  }
  const index = parseInt(indexStr, 10)
  if (isNaN(index)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Index must be a number' })
    return z.NEVER
  }
  return { txHash, index }
})

// ── Faucet API Schemas ──

export const faucetClaimRequestSchema = z.object({
  address: z.string().min(1, 'Address required'),
})

export const faucetClaimResponseSchema = z.object({
  claim_event: z
    .object({
      id: z.number().optional(),
      address_hash: z.string(),
      amount: z.union([z.string(), z.number()]),
      status: z.string().optional(),
    })
    .optional(),
  error: z.string().optional(),
})

const claimEventAttributesSchema = z.object({
  addressHash: z.string(),
  capacity: z.string(),
  status: z.string(),
  txStatus: z.string().nullable(),
  txHash: z.string().nullable(),
  timestamp: z.string(),
})

const claimEventItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  attributes: claimEventAttributesSchema,
})

export const faucetStatusResponseSchema = z.object({
  claimEvents: z
    .object({
      data: z.array(claimEventItemSchema),
    })
    .optional(),
  error: z.string().optional(),
})
