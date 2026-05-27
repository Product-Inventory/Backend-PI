import { z } from 'zod'

const booleanLike = z.union([
  z.boolean(),
  z.enum(['true', 'false'])
]).transform((value) => {
  if (typeof value === 'boolean') return value
  return value === 'true'
})

const recepcionItemSchema = z.object({
  productId: z.string({ required_error: 'El productId es obligatorio' }).min(1, 'El productId es obligatorio'),
  cantidad: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  costoUnitario: z.coerce.number().min(0, 'El costo unitario no puede ser negativo')
})

export const listRecepcionesQuerySchema = z.object({
  q: z.string().optional().default(''),
  status: z.enum(['DRAFT', 'CONFIRMED']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10)
})

export const recepcionIdParamSchema = z.object({
  id: z.string().min(1, 'El id es obligatorio')
})

export const createRecepcionSchema = z.object({
  supplierId: z.string({ required_error: 'El supplierId es obligatorio' }).min(1, 'El supplierId es obligatorio'),
  fecha: z.string({ required_error: 'La fecha es obligatoria' }).min(1, 'La fecha es obligatoria'),
  // folio: generado automáticamente por el backend, no se recibe del cliente
  comentarios: z.string().optional().nullable(),
  items: z.array(recepcionItemSchema).min(1, 'Debes agregar al menos una partida')
})

export const updateRecepcionSchema = z.object({
  supplierId: z.string().min(1, 'El supplierId es obligatorio').optional(),
  fecha: z.string().min(1, 'La fecha es obligatoria').optional(),
  // folio: no editable después de la creación
  comentarios: z.string().nullable().optional(),
  items: z.array(recepcionItemSchema).min(1, 'Debes agregar al menos una partida').optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar'
})