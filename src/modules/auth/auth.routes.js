import { Router } from 'express'
import { authController } from './auth.controller.js'
import { validate } from '../../middlewares/validate.js'
import { authenticate } from '../../middlewares/auth.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { loginSchema } from './auth.schema.js'

const router = Router()

// Ruta pública: no requiere token
router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(authController.login.bind(authController))
)

// Cualquier usuario autenticado puede consultar su propio perfil, sin importar sus permisos
router.get(
  '/me',
  authenticate,
  asyncHandler(authController.me.bind(authController))
)

// Devuelve los módulos accesibles con flags de acciones; no requiere permiso especial
// porque es información derivada de los propios permisos del usuario autenticado
router.get(
  '/menu',
  authenticate,
  asyncHandler(authController.menu.bind(authController))
)

export default router