import { Router } from 'express'
import { inventoryController } from './inventory.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { PERMS } from '../../constants/permissions.js'
import {
  adjustInventorySchema,
  inventoryProductIdParamSchema,
  listInventoryMovementsQuerySchema,
  listInventoryQuerySchema
} from './inventory.schema.js'

const router = Router()

router.get(
  '/',
  authenticate,
  requirePermissions([PERMS.INVENTORY.READ]),
  validate(listInventoryQuerySchema, 'query'),
  asyncHandler(inventoryController.list.bind(inventoryController))
)

router.get(
  '/movements',
  authenticate,
  requirePermissions([PERMS.INVENTORY.READ]),
  validate(listInventoryMovementsQuerySchema, 'query'),
  asyncHandler(inventoryController.listMovements.bind(inventoryController))
)

router.get(
  '/:productId',
  authenticate,
  requirePermissions([PERMS.INVENTORY.READ]),
  validate(inventoryProductIdParamSchema, 'params'),
  asyncHandler(inventoryController.getByProductId.bind(inventoryController))
)

router.patch(
  '/:productId/adjust',
  authenticate,
  requirePermissions([PERMS.INVENTORY.UPDATE]),
  validate(inventoryProductIdParamSchema, 'params'),
  validate(adjustInventorySchema),
  asyncHandler(inventoryController.adjust.bind(inventoryController))
)

export default router