import { Router } from 'express'
import { recepcionesController } from './recepciones.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { PERMS } from '../../constants/permissions.js'
import {
  createRecepcionSchema,
  listRecepcionesQuerySchema,
  recepcionIdParamSchema,
  updateRecepcionSchema
} from './recepciones.schema.js'

const router = Router()

router.get(
  '/',
  authenticate,
  requirePermissions([PERMS.RECEPCIONES.READ]),
  validate(listRecepcionesQuerySchema, 'query'),
  asyncHandler(recepcionesController.list.bind(recepcionesController))
)

router.get(
  '/:id',
  authenticate,
  requirePermissions([PERMS.RECEPCIONES.READ]),
  validate(recepcionIdParamSchema, 'params'),
  asyncHandler(recepcionesController.getById.bind(recepcionesController))
)

router.post(
  '/',
  authenticate,
  requirePermissions([PERMS.RECEPCIONES.CREATE]),
  validate(createRecepcionSchema),
  asyncHandler(recepcionesController.create.bind(recepcionesController))
)

router.patch(
  '/:id',
  authenticate,
  requirePermissions([PERMS.RECEPCIONES.UPDATE]),
  validate(recepcionIdParamSchema, 'params'),
  validate(updateRecepcionSchema),
  asyncHandler(recepcionesController.update.bind(recepcionesController))
)

router.patch(
  '/:id/confirm',
  authenticate,
  requirePermissions([PERMS.RECEPCIONES.UPDATE]),
  validate(recepcionIdParamSchema, 'params'),
  asyncHandler(recepcionesController.confirm.bind(recepcionesController))
)

router.delete(
  '/:id',
  authenticate,
  requirePermissions([PERMS.RECEPCIONES.DELETE]),
  validate(recepcionIdParamSchema, 'params'),
  asyncHandler(recepcionesController.remove.bind(recepcionesController))
)

export default router