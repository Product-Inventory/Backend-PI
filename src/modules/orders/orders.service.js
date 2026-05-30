import { ordersRepository } from './orders.repository.js'
import { productsRepository } from '../products/products.repository.js'
import { clientsRepository } from '../clients/clients.repository.js'
import { logAuditEvent } from '../../utils/audit.js'
import { getNextFolio } from '../../utils/counters.js'

function normalizeOptionalText(value) {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = String(value).trim()
  return trimmed === '' ? '' : trimmed
}

function normalizeDateString(value) {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = String(value).trim()
  return trimmed === '' ? null : trimmed
}

export class OrdersService {
  async list(query) {
    const { q = '', status, page = 1, limit = 10 } = query

    const allOrders = await ordersRepository.findAll()
    let filtered = allOrders

    if (q) {
      const term = q.trim().toLowerCase()
      filtered = filtered.filter((order) => {
        return (
          String(order.folio || '').toLowerCase().includes(term) ||
          String(order.clienteNombre || '').toLowerCase().includes(term)
        )
      })
    }

    if (status) {
      filtered = filtered.filter((order) => order.status === status)
    }

    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

    const total = filtered.length
    const start = (page - 1) * limit
    const end = start + limit

    const items = filtered.slice(start, end).map((order) => this.sanitizeOrder(order))

    return { items, total, page, limit }
  }

  async getById(id) {
    const order = await ordersRepository.findById(id)
    if (!order) {
      const error = new Error('Orden no encontrada')
      error.statusCode = 404
      throw error
    }
    return this.sanitizeOrder(order)
  }

  async create(payload, currentUser = null) {
    // Folio generado automáticamente por el backend de forma atómica
    const folio = await getNextFolio('orders', 'ORD')

    const client = await clientsRepository.findById(payload.clienteId)
    if (!client) {
      const error = new Error('Cliente no encontrado')
      error.statusCode = 404
      throw error
    }

    const processedItems = []
    let itemsTotal = 0

    for (const item of payload.items) {
      const product = await productsRepository.findById(item.productId)
      if (!product) {
        const error = new Error('Producto no encontrado')
        error.statusCode = 404
        throw error
      }

      const cantidad = Number(item.cantidad)
      const precioUnitario = Number(item.precioUnitario)
      const itemSubtotal = cantidad * precioUnitario
      itemsTotal += itemSubtotal

      processedItems.push({
        productId: product.id,
        sku: product.sku || '',
        productNombre: product.nombre || '',
        cantidad,
        precioUnitario,
        subtotal: itemSubtotal // OK por item
      })
    }

    const impuestos = 0
    const total = itemsTotal + impuestos
    const now = new Date().toISOString()

    const data = {
      folio,
      fechaOrden: normalizeDateString(payload.fechaOrden) || '',
      fechaEntrega: normalizeDateString(payload.fechaEntrega) ?? null,

      clienteId: client.id,
      clienteNombre: client.nombre || '',
      comentarios: normalizeOptionalText(payload.comentarios) || '',

      status: 'DRAFT',
      items: processedItems,

      impuestos,
      total,

      confirmedAt: null,
      confirmedBy: null,
      confirmedByUserId: null,
      createdAt: now,
      updatedAt: now
    }

    const created = await ordersRepository.create(data)
    const sanitized = this.sanitizeOrder(created)

    await logAuditEvent({
      action: 'CREATE',
      resource: 'orders',
      resourceId: created.id,
      details: {
        folio: sanitized.folio,
        clienteNombre: sanitized.clienteNombre,
        total: sanitized.total,
        status: sanitized.status
      },
      currentUser
    })

    return sanitized
  }

  async update(id, payload, currentUser = null) {
    const currentOrder = await ordersRepository.findById(id)
    if (!currentOrder) {
      const error = new Error('Orden no encontrada')
      error.statusCode = 404
      throw error
    }

    if (currentOrder.status !== 'DRAFT') {
      const error = new Error('Solo se pueden editar órdenes en borrador')
      error.statusCode = 400
      throw error
    }

    const data = {
      updatedAt: new Date().toISOString()
    }

    // El folio no se puede modificar una vez asignado automáticamente

    if (payload.fechaOrden !== undefined) {
      data.fechaOrden = normalizeDateString(payload.fechaOrden) || ''
    }

    if (payload.fechaEntrega !== undefined) {
      data.fechaEntrega = normalizeDateString(payload.fechaEntrega) ?? null
    }

    if (payload.clienteId !== undefined) {
      const client = await clientsRepository.findById(payload.clienteId)
      if (!client) {
        const error = new Error('Cliente no encontrado')
        error.statusCode = 404
        throw error
      }
      data.clienteId = client.id
      data.clienteNombre = client.nombre || ''
    }

    if (payload.comentarios !== undefined) {
      data.comentarios = normalizeOptionalText(payload.comentarios) || ''
    }

    if (payload.items !== undefined) {
      const processedItems = []
      let itemsTotal = 0

      for (const item of payload.items) {
        const product = await productsRepository.findById(item.productId)
        if (!product) {
          const error = new Error('Producto no encontrado')
          error.statusCode = 404
          throw error
        }

        const cantidad = Number(item.cantidad)
        const precioUnitario = Number(item.precioUnitario)
        const itemSubtotal = cantidad * precioUnitario
        itemsTotal += itemSubtotal

        processedItems.push({
          productId: product.id,
          sku: product.sku || '',
          productNombre: product.nombre || '',
          cantidad,
          precioUnitario,
          subtotal: itemSubtotal
        })
      }

      data.items = processedItems
      data.impuestos = 0
      data.total = itemsTotal + data.impuestos
    }

    const updated = await ordersRepository.update(id, data)
    const sanitized = this.sanitizeOrder(updated)

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'orders',
      resourceId: updated.id,
      details: {
        folio: sanitized.folio,
        changes: Object.keys(payload)
      },
      currentUser
    })

    return sanitized
  }

  async confirm(id, currentUser = null) {
    const currentOrder = await ordersRepository.findById(id)
    if (!currentOrder) {
      const error = new Error('Orden no encontrada')
      error.statusCode = 404
      throw error
    }

    if (currentOrder.status !== 'DRAFT') {
      const error = new Error('Solo se pueden confirmar órdenes en borrador')
      error.statusCode = 400
      throw error
    }

    for (const item of currentOrder.items) {
      const product = await productsRepository.findById(item.productId)
      if (!product) {
        const error = new Error(`Producto no encontrado: ${item.productNombre}`)
        error.statusCode = 404
        throw error
      }
      if (Number(product.stock || 0) < Number(item.cantidad)) {
        const error = new Error(`Stock insuficiente para ${product.nombre}`)
        error.statusCode = 400
        throw error
      }
    }

    for (const item of currentOrder.items) {
      const product = await productsRepository.findById(item.productId)
      const newStock = Number(product.stock || 0) - Number(item.cantidad)
      await productsRepository.update(product.id, {
        stock: newStock,
        updatedAt: new Date().toISOString()
      })
    }

    const updated = await ordersRepository.update(id, {
      status: 'CONFIRMED',
      confirmedAt: new Date().toISOString(),
      confirmedBy: currentUser?.nombre || '',
      confirmedByUserId: currentUser?.id || '',
      updatedAt: new Date().toISOString()
    })

    const sanitized = this.sanitizeOrder(updated)

    await logAuditEvent({
      action: 'CONFIRM',
      resource: 'orders',
      resourceId: updated.id,
      details: {
        folio: sanitized.folio,
        total: sanitized.total
      },
      currentUser
    })

    return sanitized
  }

  async deliver(id, fechaEntrega, currentUser = null) {
    const order = await ordersRepository.findById(id)
    if (!order) {
      const error = new Error('Orden no encontrada')
      error.statusCode = 404
      throw error
    }

    if (order.status !== 'CONFIRMED') {
      const error = new Error('Solo se pueden entregar órdenes confirmadas')
      error.statusCode = 400
      throw error
    }

    const updated = await ordersRepository.update(id, {
      status: 'DELIVERED',
      fechaEntrega: fechaEntrega || order.fechaEntrega,
      updatedAt: new Date().toISOString(),
    });

    const sanitized = this.sanitizeOrder(updated);

    await logAuditEvent({
      action: 'DELIVER',
      resource: 'orders',
      resourceId: updated.id,
      details: { folio: sanitized.folio },
      currentUser
    });

    return sanitized;
  }

  async cancel(id, currentUser = null) {
    const currentOrder = await ordersRepository.findById(id)
    if (!currentOrder) {
      const error = new Error('Orden no encontrada')
      error.statusCode = 404
      throw error
    }

    // Solo las órdenes CONFIRMADAS descontaron stock al confirmarse.
    // Al cancelarlas hay que devolver ese stock para que el inventario
    // refleje el cambio. Las DRAFT nunca descontaron y las DELIVERED ya
    // salieron del almacén, así que no se reponen.
    if (currentOrder.status === 'CONFIRMED' && Array.isArray(currentOrder.items)) {
      for (const item of currentOrder.items) {
        const product = await productsRepository.findById(item.productId)
        if (!product) continue
        const newStock = Number(product.stock || 0) + Number(item.cantidad || 0)
        await productsRepository.update(product.id, {
          stock: newStock,
          updatedAt: new Date().toISOString()
        })
      }
    }

    const updated = await ordersRepository.update(id, {
      status: 'CANCELLED',
      updatedAt: new Date().toISOString()
    })

    const sanitized = this.sanitizeOrder(updated)

    await logAuditEvent({
      action: 'CANCEL',
      resource: 'orders',
      resourceId: updated.id,
      details: { folio: sanitized.folio },
      currentUser
    })

    return sanitized
  }

  async remove(id, currentUser = null) {
    const currentOrder = await ordersRepository.findById(id)
    if (!currentOrder) {
      const error = new Error('Orden no encontrada')
      error.statusCode = 404
      throw error
    }

    await ordersRepository.remove(id)

    await logAuditEvent({
      action: 'DELETE',
      resource: 'orders',
      resourceId: id,
      details: { folio: currentOrder.folio || '' },
      currentUser
    })

    return { success: true }
  }

  sanitizeOrder(order) {
    const fechaOrden = order.fechaOrden ?? order.fecha ?? ''

    return {
      id: order.id,
      folio: order.folio || '',

      fechaOrden: fechaOrden || '',
      fechaEntrega: order.fechaEntrega ?? null,

      clienteId: order.clienteId || '',
      clienteNombre: order.clienteNombre || '',
      comentarios: order.comentarios || '',

      status: order.status || 'DRAFT',
      items: Array.isArray(order.items) ? order.items : [],

      impuestos: Number(order.impuestos || 0),
      total: Number(order.total || 0),

      confirmedAt: order.confirmedAt || null,
      confirmedBy: order.confirmedBy || null,
      confirmedByUserId: order.confirmedByUserId || null,
      createdAt: order.createdAt || null,
      updatedAt: order.updatedAt || null
    }
  }
}

export const ordersService = new OrdersService()