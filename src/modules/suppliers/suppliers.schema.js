import { z } from 'zod'

const booleanLike = z.union([
  z.boolean(),
  z.enum(['true', 'false'])
]).transform((value) => {
  if (typeof value === 'boolean') return value
  return value === 'true'
})

export const listSuppliersQuerySchema = z.object({
  q: z.string().optional().default(''),
  activo: booleanLike.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10)
})

export const supplierIdParamSchema = z.object({
  id: z.string().min(1, 'El id es obligatorio')
})

// RFC persona física: 4 letras + 6 dígitos (fecha) + 3 caracteres (homoclave) = 13 chars
const RFC_REGEX = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/i
const RFC_ERROR = 'El RFC debe tener 13 caracteres: 4 letras, 6 dígitos (fecha de nacimiento) y 3 caracteres (homoclave)'

export const createSupplierSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  rfc: z
    .string({ required_error: 'El RFC es obligatorio' })
    .regex(RFC_REGEX, RFC_ERROR),
  email: z
    .string({ required_error: 'El email es obligatorio' })
    .email('El email no es válido'),
  telefono: z
    .string({ required_error: 'El teléfono es obligatorio' })
    .regex(/^\d{10}$/, 'El teléfono debe tener exactamente 10 dígitos'),
  direccion: z.string().optional().nullable(),
  contacto: z.string().optional().nullable(),
  giro: z
    .string({ required_error: 'El giro es obligatorio' })
    .min(2, 'El giro debe tener al menos 2 caracteres'),
  notas: z.string().optional().nullable(),
  activo: z.boolean().optional().default(true)
})

export const updateSupplierSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  rfc: z.string().regex(RFC_REGEX, RFC_ERROR).optional(),
  email: z.string().email('El email no es válido').optional(),
  telefono: z.string().regex(/^\d{10}$/, 'El teléfono debe tener exactamente 10 dígitos').optional(),
  direccion: z.string().nullable().optional(),
  contacto: z.string().nullable().optional(),
  giro: z.string().min(2, 'El giro debe tener al menos 2 caracteres').optional(),
  notas: z.string().nullable().optional(),
  activo: z.boolean().optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar'
})

export const toggleSupplierActiveSchema = z.object({
  activo: z.boolean({
    required_error: 'El campo activo es obligatorio'
  })
})