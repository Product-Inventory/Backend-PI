import { Router } from 'express'
import { auditController } from './audit.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { PERMS } from '../../constants/permissions.js'
import {
  auditIdParamSchema,
  createAuditSchema,
  listAuditQuerySchema
} from './audit.schema.js'

const router = Router()

router.get(
  '/',
  authenticate,
  requirePermissions([PERMS.AUDIT.READ]),
  validate(listAuditQuerySchema, 'query'),
  asyncHandler(auditController.list.bind(auditController))
)

router.get(
  '/:id',
  authenticate,
  requirePermissions([PERMS.AUDIT.READ]),
  validate(auditIdParamSchema, 'params'),
  asyncHandler(auditController.getById.bind(auditController))
)

// FIXED: antes usaba se audit:read para una operación de escritura
router.post(
  '/',
  authenticate,
  requirePermissions([PERMS.AUDIT.CREATE]),
  validate(createAuditSchema),
  asyncHandler(auditController.create.bind(auditController))
)

export default router