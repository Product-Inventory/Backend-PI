import { Router } from 'express'
import { permissionsController } from './permissions.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { PERMS } from '../../constants/permissions.js'
import {
  createPermissionSchema,
  listPermissionsQuerySchema,
  permissionIdParamSchema,
  updatePermissionSchema
} from './permissions.schema.js'

const router = Router()

router.get(
  '/',
  authenticate,
  requirePermissions([PERMS.PERMISSIONS.READ]),
  validate(listPermissionsQuerySchema, 'query'),
  asyncHandler(permissionsController.list.bind(permissionsController))
)

router.get(
  '/:id',
  authenticate,
  requirePermissions([PERMS.PERMISSIONS.READ]),
  validate(permissionIdParamSchema, 'params'),
  asyncHandler(permissionsController.getById.bind(permissionsController))
)

router.post(
  '/',
  authenticate,
  requirePermissions([PERMS.PERMISSIONS.CREATE]),
  validate(createPermissionSchema),
  asyncHandler(permissionsController.create.bind(permissionsController))
)

router.post(
  '/seed',
  authenticate,
  requirePermissions([PERMS.PERMISSIONS.SEED]),
  asyncHandler(permissionsController.seed.bind(permissionsController))
)

router.patch(
  '/:id',
  authenticate,
  requirePermissions([PERMS.PERMISSIONS.UPDATE]),
  validate(permissionIdParamSchema, 'params'),
  validate(updatePermissionSchema),
  asyncHandler(permissionsController.update.bind(permissionsController))
)

router.delete(
  '/:id',
  authenticate,
  requirePermissions([PERMS.PERMISSIONS.DELETE]),
  validate(permissionIdParamSchema, 'params'),
  asyncHandler(permissionsController.remove.bind(permissionsController))
)

export default router