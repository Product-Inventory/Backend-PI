import { inventoryRepository } from './inventory.repository.js'
import { logAuditEvent } from '../../utils/audit.js'

export class InventoryService {
  async list(query) {
    const {
      q = '',
      page = 1,
      limit = 10
    } = query

    // Estas dos lineas son por que express siempre entrega strings en el req.query
    // Entonces hay que parsearlos explícitamente
    const activo = query.activo === 'true' ? true : query.activo === 'false' ? false : undefined
    const lowStock = query.lowStock === 'true'

    const allProducts = await inventoryRepository.findAllProducts()

    let filtered = allProducts

    if (q) {
      const term = q.trim().toLowerCase()

      filtered = filtered.filter((product) => {
        return (
          String(product.sku || '').toLowerCase().includes(term) ||
          String(product.nombre || '').toLowerCase().includes(term) ||
          String(product.descripcion || '').toLowerCase().includes(term) ||
          String(product.categoria || '').toLowerCase().includes(term) ||
          String(product.marca || '').toLowerCase().includes(term) ||
          String(product.modelo || '').toLowerCase().includes(term)
        )
      })
    }

    // El parametro activo ahora si es true o false o unidefined para que no filtre
    if (activo !== undefined) {
      filtered = filtered.filter((product) => (product.activo ?? true) === activo)
    }

    // lowStock ahora tambien es un booleano real
    if (lowStock) {
      filtered = filtered.filter((product) => {
        const stock = Number(product.stock || 0)
        const stockMinimo = Number(product.stockMinimo || 0)
        return stock <= stockMinimo
      })
    }

    filtered.sort((a, b) => {
      const aName = String(a.nombre || '').toLowerCase()
      const bName = String(b.nombre || '').toLowerCase()
      return aName.localeCompare(bName)
    })

    const total = filtered.length
    const start = (page - 1) * limit
    const end = start + limit
    const items = filtered.slice(start, end).map((product) => this.sanitizeInventoryItem(product))

    return {
      items,
      total,
      page,
      limit
    }
  }

  async getByProductId(productId) {
    const product = await inventoryRepository.findProductById(productId)

    if (!product) {
      const error = new Error('Producto no encontrado')
      error.statusCode = 404
      throw error
    }

    return this.sanitizeInventoryItem(product)
  }

  async adjust(productId, payload, currentUser = null) {
    const product = await inventoryRepository.findProductById(productId)

    if (!product) {
      const error = new Error('Producto no encontrado')
      error.statusCode = 404
      throw error
    }

    const currentStock = Number(product.stock || 0)
    const cantidad = Number(payload.cantidad)
    let newStock = currentStock

    if (payload.tipo === 'ENTRADA') {
      newStock = currentStock + cantidad
    } else if (payload.tipo === 'SALIDA') {
      newStock = currentStock - cantidad

      if (newStock < 0) {
        const error = new Error('No hay stock suficiente para realizar la salida')
        error.statusCode = 400
        throw error
      }
    } else if (payload.tipo === 'AJUSTE') {
      newStock = cantidad
    }

    const updatedProduct = await inventoryRepository.updateProductStock(productId, {
      stock: newStock,
      updatedAt: new Date().toISOString()
    })

    const movement = await inventoryRepository.createMovement({
      productId: product.id,
      sku: product.sku || '',
      productNombre: product.nombre || '',
      tipo: payload.tipo,
      cantidad,
      stockAnterior: currentStock,
      stockNuevo: newStock,
      motivo: payload.motivo,
      referencia: payload.referencia || '',
      userId: currentUser?.sub || '',
      usuario: currentUser?.usuario || '',
      createdAt: new Date().toISOString()
    })

    await logAuditEvent({
      action: 'ADJUST',
      resource: 'inventory',
      resourceId: product.id,
      details: {
        sku: product.sku || '',
        nombre: product.nombre || '',
        tipo: payload.tipo,
        cantidad,
        stockAnterior: currentStock,
        stockNuevo: newStock,
        motivo: payload.motivo,
        referencia: payload.referencia || ''
      },
      currentUser
    })

    return {
      message: 'Inventario ajustado correctamente',
      item: this.sanitizeInventoryItem(updatedProduct),
      movement: this.sanitizeMovement(movement)
    }
  }

  async listMovements(query) {
    const {
      q = '',
      productId,
      tipo,
      page = 1,
      limit = 10
    } = query

    const allMovements = await inventoryRepository.findAllMovements()

    let filtered = allMovements

    if (productId) {
      filtered = filtered.filter((movement) => movement.productId === productId)
    }

    if (tipo) {
      filtered = filtered.filter((movement) => movement.tipo === tipo)
    }

    if (q) {
      const term = q.trim().toLowerCase()

      filtered = filtered.filter((movement) => {
        return (
          String(movement.sku || '').toLowerCase().includes(term) ||
          String(movement.productNombre || '').toLowerCase().includes(term) ||
          String(movement.motivo || '').toLowerCase().includes(term) ||
          String(movement.usuario || '').toLowerCase().includes(term) ||
          String(movement.referencia || '').toLowerCase().includes(term)
        )
      })
    }

    filtered.sort((a, b) => {
      const aDate = new Date(a.createdAt || 0).getTime()
      const bDate = new Date(b.createdAt || 0).getTime()
      return bDate - aDate
    })

    const total = filtered.length
    const start = (page - 1) * limit
    const end = start + limit
    const items = filtered.slice(start, end).map((movement) => this.sanitizeMovement(movement))

    return {
      items,
      total,
      page,
      limit
    }
  }

  sanitizeInventoryItem(product) {
    const stock = Number(product.stock || 0)
    const stockMinimo = Number(product.stockMinimo || 0)

    return {
      id: product.id,
      productId: product.id,
      sku: product.sku || '',
      nombre: product.nombre || '',
      descripcion: product.descripcion || '',
      categoria: product.categoria || '',
      unidad: product.unidad || '',
      marca: product.marca || '',
      modelo: product.modelo || '',
      stock,
      stockMinimo,
      lowStock: stock <= stockMinimo,
      activo: product.activo ?? true,
      updatedAt: product.updatedAt || null
    }
  }

  sanitizeMovement(movement) {
    return {
      id: movement.id,
      productId: movement.productId || '',
      sku: movement.sku || '',
      productNombre: movement.productNombre || '',
      tipo: movement.tipo || '',
      cantidad: Number(movement.cantidad || 0),
      stockAnterior: Number(movement.stockAnterior || 0),
      stockNuevo: Number(movement.stockNuevo || 0),
      motivo: movement.motivo || '',
      referencia: movement.referencia || '',
      userId: movement.userId || '',
      usuario: movement.usuario || '',
      createdAt: movement.createdAt || null
    }
  }
}

export const inventoryService = new InventoryService()