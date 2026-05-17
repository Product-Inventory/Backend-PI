import { Router } from 'express'
import { rolesController } from './roles.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { PERMS } from '../../constants/permissions.js'
import {
  createRoleSchema,
  listRolesQuerySchema,
  roleIdParamSchema,
  updateRoleSchema
} from './roles.schema.js'

const router = Router()

router.get(
  '/',
  authenticate,
  requirePermissions([PERMS.ROLES.READ]),
  validate(listRolesQuerySchema, 'query'),
  asyncHandler(rolesController.list.bind(rolesController))
)

router.get(
  '/:id',
  authenticate,
  requirePermissions([PERMS.ROLES.READ]),
  validate(roleIdParamSchema, 'params'),
  asyncHandler(rolesController.getById.bind(rolesController))
)

router.post(
  '/',
  authenticate,
  requirePermissions([PERMS.ROLES.CREATE]),
  validate(createRoleSchema),
  asyncHandler(rolesController.create.bind(rolesController))
)

router.patch(
  '/:id',
  authenticate,
  requirePermissions([PERMS.ROLES.UPDATE]),
  validate(roleIdParamSchema, 'params'),
  validate(updateRoleSchema),
  asyncHandler(rolesController.update.bind(rolesController))
)

router.delete(
  '/:id',
  authenticate,
  requirePermissions([PERMS.ROLES.DELETE]),
  validate(roleIdParamSchema, 'params'),
  asyncHandler(rolesController.remove.bind(rolesController))
)

export default router