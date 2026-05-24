import { Router } from 'express'
import { ordersController } from './orders.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { PERMS } from '../../constants/permissions.js'
import { createOrderSchema, listOrdersQuerySchema, orderIdParamSchema, updateOrderSchema} from './orders.schema.js'

const router = Router()

router.get(
  '/',
  authenticate,
  requirePermissions([PERMS.ORDERS.READ]),
  validate(listOrdersQuerySchema, 'query'),
  asyncHandler(
    ordersController.list.bind(ordersController)
  )
)

router.get(
  '/:id',
  authenticate,
  requirePermissions([PERMS.ORDERS.READ]),
  validate(orderIdParamSchema, 'params'),
  asyncHandler(
    ordersController.getById.bind(
      ordersController
    )
  )
)

router.post(
  '/',
  authenticate,
  requirePermissions([PERMS.ORDERS.CREATE]),
  validate(createOrderSchema),
  asyncHandler(
    ordersController.create.bind(
      ordersController
    )
  )
)

router.patch(
  '/:id',
  authenticate,
  requirePermissions([PERMS.ORDERS.UPDATE]),
  validate(orderIdParamSchema, 'params'),
  validate(updateOrderSchema),
  asyncHandler(
    ordersController.update.bind(
      ordersController
    )
  )
)

router.patch(
  '/:id/confirm',
  authenticate,
  requirePermissions([PERMS.ORDERS.UPDATE]),
  validate(orderIdParamSchema, 'params'),
  asyncHandler(
    ordersController.confirm.bind(
      ordersController
    )
  )
)

router.patch(
  '/:id/deliver',
  authenticate,
  requirePermissions([PERMS.ORDERS.UPDATE]),
  validate(orderIdParamSchema, 'params'),
  asyncHandler(
    ordersController.deliver.bind(ordersController)
  )
)

router.patch(
  '/:id/cancel',
  authenticate,
  requirePermissions([PERMS.ORDERS.UPDATE]),
  validate(orderIdParamSchema, 'params'),
  asyncHandler(
    ordersController.cancel.bind(
      ordersController
    )
  )
)

router.delete(
  '/:id',
  authenticate,
  requirePermissions([PERMS.ORDERS.DELETE]),
  validate(orderIdParamSchema, 'params'),
  asyncHandler(
    ordersController.remove.bind(
      ordersController
    )
  )
)

export default router