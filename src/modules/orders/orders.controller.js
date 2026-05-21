import { ordersService } from './orders.service.js'

export class OrdersController {
  async list(req, res) {
    const result = await ordersService.list(
      req.validatedQuery || req.query
    )
    return res.status(200).json(result)
  }

  async getById(req, res) {
    const order = await ordersService.getById(req.params.id)
    return res.status(200).json({
      item: order
    })
  }

  async create(req, res) {
    const order = await ordersService.create(
      req.body,
      req.user
    )
    return res.status(201).json({
      message: 'Orden creada correctamente',
      item: order
    })
  }

  async update(req, res) {
    const order = await ordersService.update(
      req.params.id,
      req.body,
      req.user
    )
    return res.status(200).json({
      message: 'Orden actualizada correctamente',
      item: order
    })
  }

  async confirm(req, res) {
    const order = await ordersService.confirm(
      req.params.id,
      req.user
    )
    return res.status(200).json({
      message: 'Orden confirmada correctamente',
      item: order
    })
  }

  async cancel(req, res) {
    const order = await ordersService.cancel(
      req.params.id,
      req.user
    )
    return res.status(200).json({
      message: 'Orden cancelada correctamente',
      item: order
    })
  }

  async remove(req, res) {
    await ordersService.remove(
      req.params.id,
      req.user
    )
    return res.status(200).json({
      message: 'Orden eliminada correctamente'
    })
  }
}

export const ordersController = new OrdersController()