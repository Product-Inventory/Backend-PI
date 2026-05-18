import { Router } from 'express'
import { clientsController } from './clients.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { PERMS } from '../../constants/permissions.js'
import {
  clientIdParamSchema,
  createClientSchema,
  listClientsQuerySchema,
  toggleClientActiveSchema,
  updateClientSchema
} from './clients.schema.js'

const router = Router()

router.get(
  '/',
  authenticate,
  requirePermissions([PERMS.CLIENTS.READ]),
  validate(listClientsQuerySchema, 'query'),
  asyncHandler(clientsController.list.bind(clientsController))
)

router.get(
  '/:id',
  authenticate,
  requirePermissions([PERMS.CLIENTS.READ]),
  validate(clientIdParamSchema, 'params'),
  asyncHandler(clientsController.getById.bind(clientsController))
)

router.post(
  '/',
  authenticate,
  requirePermissions([PERMS.CLIENTS.CREATE]),
  validate(createClientSchema),
  asyncHandler(clientsController.create.bind(clientsController))
)

router.patch(
  '/:id',
  authenticate,
  requirePermissions([PERMS.CLIENTS.UPDATE]),
  validate(clientIdParamSchema, 'params'),
  validate(updateClientSchema),
  asyncHandler(clientsController.update.bind(clientsController))
)

router.patch(
  '/:id/toggle-active',
  authenticate,
  requirePermissions([PERMS.CLIENTS.UPDATE]),
  validate(clientIdParamSchema, 'params'),
  validate(toggleClientActiveSchema),
  asyncHandler(clientsController.toggleActive.bind(clientsController))
)

router.delete(
  '/:id',
  authenticate,
  requirePermissions([PERMS.CLIENTS.DELETE]),
  validate(clientIdParamSchema, 'params'),
  asyncHandler(clientsController.remove.bind(clientsController))
)

export default router