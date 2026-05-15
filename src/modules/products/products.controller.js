import { productsService } from './products.service.js'

export class ProductsController {
  async list(req, res) {
    const result = await productsService.list(req.validatedQuery || req.query)

    return res.status(200).json(result)
  }

  async getById(req, res) {
    const product = await productsService.getById(req.params.id)

    return res.status(200).json({
      item: product
    })
  }

  async create(req, res) {
    const product = await productsService.create(req.body, req.user)

    return res.status(201).json({
      message: 'Producto creado correctamente',
      item: product
    })
  }

  async update(req, res) {
    const product = await productsService.update(req.params.id, req.body, req.user)

    return res.status(200).json({
      message: 'Producto actualizado correctamente',
      item: product
    })
  }

  async toggleActive(req, res) {
    const product = await productsService.toggleActive(req.params.id, req.body.activo, req.user)

    return res.status(200).json({
      message: 'Estado del producto actualizado correctamente',
      item: product
    })
  }

  async remove(req, res) {
    await productsService.remove(req.params.id, req.user)

    return res.status(200).json({
      message: 'Producto eliminado correctamente'
    })
  }
}

export const productsController = new ProductsController()