/**
 * Zod validation schemas for all API request bodies.
 * All inputs are validated server-side before touching the DB.
 * Never trust frontend validation alone.
 */
import { z } from 'zod'

// ── Shared primitives ──────────────────────────────────────────────────────

const safeString = (max = 500) =>
  z.string().trim().min(1).max(max)

const optionalSafeString = (max = 500) =>
  z.string().trim().max(max).optional()

/** Validates a BSV/HandCash handle or PayMail address */
const paymentAddress = z
  .string()
  .trim()
  .max(200)
  .regex(
    /^(\$[a-zA-Z0-9_.-]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/,
    'Must be a HandCash handle (e.g. $alice) or PayMail (alice@example.com)'
  )
  .optional()

// ── Auth ──────────────────────────────────────────────────────────────────

export const HandCashAuthSchema = z.object({
  authToken: z.string().trim().min(10).max(1000),
})

// ── Assets ────────────────────────────────────────────────────────────────

export const CreateAssetSchema = z.object({
  name: safeString(200),
  description: safeString(2000),
  category: safeString(50),
  imageUrl: z.string().url().max(500).optional().or(z.literal('')),
  rentalRatePerDay: z.number().positive().max(1_000_000),
  depositAmount: z.number().nonnegative().max(10_000_000),
  currency: z.enum(['USD', 'BSV', 'EUR', 'GBP']).default('USD'),
  location: z.object({
    city: safeString(100),
    state: safeString(100),
    address: safeString(300),
  }),
  accessCode: optionalSafeString(200),
  specialInstructions: optionalSafeString(1000),
  unlockFee: z.number().positive().max(1).default(0.0001),
  condition: z.enum(['excellent', 'good', 'fair']).default('excellent'),
  accessories: z.array(z.string().trim().max(100)).max(50).default([]),
  paymentAddress,
})

export const UpdateAssetSchema = z.object({
  assetId: z.string().trim().min(1).max(100),
  name: safeString(200).optional(),
  description: safeString(2000).optional(),
  imageUrl: z.string().url().max(500).optional().or(z.literal('')),
  rentalRatePerDay: z.number().positive().max(1_000_000).optional(),
  depositAmount: z.number().nonnegative().max(10_000_000).optional(),
  condition: z.enum(['excellent', 'good', 'fair']).optional(),
  specialInstructions: optionalSafeString(1000),
  status: z.enum(['available', 'rented', 'maintenance', 'inactive']).optional(),
})

// ── Rentals ───────────────────────────────────────────────────────────────

export const CreateRentalSchema = z.object({
  assetId: z.string().trim().min(1).max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  message: optionalSafeString(500),
})

// ── Escrow ────────────────────────────────────────────────────────────────

export const CreateEscrowSchema = z.object({
  rentalId: z.string().trim().min(1).max(100),
  depositAmount: z.number().positive().max(10_000_000),
})

export const FundEscrowSchema = z.object({
  escrowId: z.string().trim().min(1).max(100),
  txid: z.string().trim().max(200),
})

export const ReleaseEscrowSchema = z.object({
  escrowId: z.string().trim().min(1).max(100),
  reason: optionalSafeString(500),
})

// ── Payments ──────────────────────────────────────────────────────────────

export const InitiatePaymentSchema = z.object({
  resourceId: z.string().trim().min(1).max(100),
  resourceType: z.enum(['asset', 'rental', 'unlock']),
})

export const VerifyPaymentSchema = z.object({
  paymentReference: z.string().trim().min(1).max(200),
  txid: z.string().trim().max(200).optional(),
})

// ── User Profile ──────────────────────────────────────────────────────────

export const UpdateProfileSchema = z.object({
  displayName: safeString(100).optional(),
  bio: optionalSafeString(500),
  location: z
    .object({
      city: optionalSafeString(100),
      state: optionalSafeString(100),
      country: optionalSafeString(100),
    })
    .optional(),
})

// ── Validation helper ─────────────────────────────────────────────────────

import type { NextApiResponse } from 'next'

/**
 * Validates req.body against a Zod schema.
 * On failure, writes a 400 response with structured field errors and returns null.
 * Usage: const body = validate(CreateAssetSchema, req.body, res); if (!body) return;
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  res: NextApiResponse
): T | null {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    res.status(400).json({ error: 'Validation failed', details: errors })
    return null
  }
  return result.data
}
