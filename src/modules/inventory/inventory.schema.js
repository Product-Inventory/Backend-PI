import { z } from 'zod'

const booleanLike = z.union([
  z.boolean(),
  z.enum(['true', 'false'])
]).transform((value) => {
  if (typeof value === 'boolean') return value
  return value === 'true'
})

export const listInventoryQuerySchema = z.object({
  q: z.string().optional().default(''),
  activo: booleanLike.optional(),
  lowStock: booleanLike.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10)
})

export const inventoryProductIdParamSchema = z.object({
  productId: z.string().min(1, 'El productId es obligatorio')
})

export const adjustInventorySchema = z.object({
  tipo: z.enum(['ENTRADA', 'SALIDA', 'AJUSTE'], {
    required_error: 'El tipo es obligatorio'
  }),
  cantidad: z.coerce.number().int('La cantidad debe ser un número entero').positive('La cantidad debe ser mayor a 0'),
  motivo: z
    .string({ required_error: 'El motivo es obligatorio' })
    .min(3, 'El motivo debe tener al menos 3 caracteres'),
  referencia: z.string().optional().nullable()
})

export const listInventoryMovementsQuerySchema = z.object({
  q: z.string().optional().default(''),
  productId: z.string().optional(),
  tipo: z.enum(['ENTRADA', 'SALIDA', 'AJUSTE']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10)
})