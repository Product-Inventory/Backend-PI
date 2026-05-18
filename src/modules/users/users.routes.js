import { Router } from 'express'
import { usersController } from './users.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { PERMS } from '../../constants/permissions.js'
import {
  createUserSchema,
  listUsersQuerySchema,
  toggleActiveSchema,
  updateUserSchema,
  userIdParamSchema
} from './users.schema.js'

const router = Router()

router.get(
  '/',
  authenticate,
  requirePermissions([PERMS.USERS.READ]),
  validate(listUsersQuerySchema, 'query'),
  asyncHandler(usersController.list.bind(usersController))
)

router.get(
  '/:id',
  authenticate,
  requirePermissions([PERMS.USERS.READ]),
  validate(userIdParamSchema, 'params'),
  asyncHandler(usersController.getById.bind(usersController))
)

router.post(
  '/',
  authenticate,
  requirePermissions([PERMS.USERS.CREATE]),
  validate(createUserSchema),
  asyncHandler(usersController.create.bind(usersController))
)

router.patch(
  '/:id',
  authenticate,
  requirePermissions([PERMS.USERS.UPDATE]),
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  asyncHandler(usersController.update.bind(usersController))
)

router.patch(
  '/:id/toggle-active',
  authenticate,
  requirePermissions([PERMS.USERS.UPDATE]),
  validate(userIdParamSchema, 'params'),
  validate(toggleActiveSchema),
  asyncHandler(usersController.toggleActive.bind(usersController))
)

router.delete(
  '/:id',
  authenticate,
  requirePermissions([PERMS.USERS.DELETE]),
  validate(userIdParamSchema, 'params'),
  asyncHandler(usersController.remove.bind(usersController))
)

export default router