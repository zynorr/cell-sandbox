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
const txHashRegex = /^0x[0-9a-fA-F]{64}$/

export const txHashSchema = z
  .string()
  .trim()
  .refine((value) => txHashRegex.test(value), {
    message: 'Transaction hash must start with 0x and contain 32 bytes of hex.',
  })

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

const faucetErrorSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.array(z.record(z.string(), z.unknown())),
  z.record(z.string(), z.unknown()),
])

const claimEventAttributesSchema = z.object({
  addressHash: z.string(),
  capacity: z.string(),
  status: z.string(),
  txStatus: z.string().nullable(),
  txHash: z.string().nullable(),
  timestamp: z.union([z.string(), z.number()]),
})

const claimEventItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  attributes: claimEventAttributesSchema,
})

export const faucetClaimResponseSchema = z.object({
  data: claimEventItemSchema.optional(),
  claim_event: z
    .object({
      id: z.union([z.string(), z.number()]).optional(),
      address_hash: z.string(),
      amount: z.union([z.string(), z.number()]),
      status: z.string().optional(),
      tx_hash: z.string().nullable().optional(),
    })
    .optional(),
  error: faucetErrorSchema.optional(),
  errors: faucetErrorSchema.optional(),
}).refine((value) => Boolean(value.data || value.claim_event || value.error || value.errors))

export const faucetStatusResponseSchema = z.object({
  claimEvents: z
    .object({
      data: z.array(claimEventItemSchema),
    })
    .optional(),
  error: z.string().optional(),
})
