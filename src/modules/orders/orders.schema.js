import { z } from 'zod'

export const listOrdersQuerySchema = z.object({
  q: z.string().optional().default(''),
  status: z
    .enum([
      'DRAFT',
      'CONFIRMED',
      'DELIVERED',
      'CANCELLED'
    ])
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10)
})

export const orderIdParamSchema = z.object({
  id: z.string().min(1, 'El id es obligatorio')
})

const orderItemSchema = z.object({
  productId: z.string().min(1),
  cantidad: z.coerce.number().min(1),
  precioUnitario: z.coerce.number().min(0)
})

export const createOrderSchema = z.object({
  folio: z.string().min(1),
  fechaOrden: z.string().min(1),
  fechaEntrega: z.string().min(1),
  clienteId: z.string().min(1),
  comentarios: z.string().nullable().optional(),
  items: z.array(orderItemSchema).min(1)
})

export const updateOrderSchema = z.object({
  folio: z.string().optional(),
  fechaOrden: z.string().optional(),
  fechaEntrega: z.string().optional(),
  clienteId: z.string().optional(),
  comentarios: z.string().nullable().optional(),
  items: z.array(orderItemSchema).optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debes enviar al menos un campo'
})