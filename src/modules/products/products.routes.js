import { Router } from 'express'
import { productsController } from './products.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { PERMS } from '../../constants/permissions.js'
import {
  createProductSchema,
  listProductsQuerySchema,
  productIdParamSchema,
  toggleProductActiveSchema,
  updateProductSchema
} from './products.schema.js'

const router = Router()

router.get(
  '/',
  authenticate,
  requirePermissions([PERMS.PRODUCTS.READ]),
  validate(listProductsQuerySchema, 'query'),
  asyncHandler(productsController.list.bind(productsController))
)

router.get(
  '/:id',
  authenticate,
  requirePermissions([PERMS.PRODUCTS.READ]),
  validate(productIdParamSchema, 'params'),
  asyncHandler(productsController.getById.bind(productsController))
)

router.post(
  '/',
  authenticate,
  requirePermissions([PERMS.PRODUCTS.CREATE]),
  validate(createProductSchema),
  asyncHandler(productsController.create.bind(productsController))
)

router.patch(
  '/:id',
  authenticate,
  requirePermissions([PERMS.PRODUCTS.UPDATE]),
  validate(productIdParamSchema, 'params'),
  validate(updateProductSchema),
  asyncHandler(productsController.update.bind(productsController))
)

router.patch(
  '/:id/toggle-active',
  authenticate,
  requirePermissions([PERMS.PRODUCTS.UPDATE]),
  validate(productIdParamSchema, 'params'),
  validate(toggleProductActiveSchema),
  asyncHandler(productsController.toggleActive.bind(productsController))
)

router.delete(
  '/:id',
  authenticate,
  requirePermissions([PERMS.PRODUCTS.DELETE]),
  validate(productIdParamSchema, 'params'),
  asyncHandler(productsController.remove.bind(productsController))
)

export default router