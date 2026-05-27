import { recepcionesRepository } from './recepciones.repository.js'
import { logAuditEvent } from '../../utils/audit.js'
import { getNextFolio } from '../../utils/counters.js'

function normalizeOptionalText(value) {
  if (value === undefined) return undefined
  if (value === null) return null

  const trimmed = String(value).trim()
  return trimmed === '' ? '' : trimmed
}

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

export class RecepcionesService {
  async list(query) {
    const {
      q = '',
      status,
      page = 1,
      limit = 10
    } = query

    const allRecepciones = await recepcionesRepository.findAll()

    let filtered = allRecepciones

    if (status) {
      filtered = filtered.filter((recepcion) => recepcion.status === status)
    }

    if (q) {
      const term = q.trim().toLowerCase()

      filtered = filtered.filter((recepcion) => {
        return (
          String(recepcion.folio || '').toLowerCase().includes(term) ||
          String(recepcion.supplierNombre || '').toLowerCase().includes(term) ||
          String(recepcion.comentarios || '').toLowerCase().includes(term) ||
          String(recepcion.status || '').toLowerCase().includes(term)
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
    const items = filtered.slice(start, end).map((recepcion) => this.sanitizeRecepcion(recepcion))

    return {
      items,
      total,
      page,
      limit
    }
  }

  async getById(id) {
    const recepcion = await recepcionesRepository.findById(id)

    if (!recepcion) {
      const error = new Error('Recepción no encontrada')
      error.statusCode = 404
      throw error
    }

    return this.sanitizeRecepcion(recepcion)
  }

  async create(payload, currentUser = null) {
    // Folio generado automáticamente por el backend de forma atómica
    const folio = await getNextFolio('recepciones', 'REC')

    const supplier = await recepcionesRepository.findSupplierById(payload.supplierId)

    if (!supplier) {
      const error = new Error('Proveedor no encontrado')
      error.statusCode = 404
      throw error
    }

    const items = []
    let total = 0

    for (const rawItem of payload.items) {
      const product = await recepcionesRepository.findProductById(rawItem.productId)

      if (!product) {
        const error = new Error(`Producto no encontrado: ${rawItem.productId}`)
        error.statusCode = 404
        throw error
      }

      const cantidad = Number(rawItem.cantidad)
      const costoUnitario = round2(rawItem.costoUnitario)
      const subtotal = round2(cantidad * costoUnitario)

      items.push({
        productId: product.id,
        sku: product.sku || '',
        productNombre: product.nombre || '',
        cantidad,
        costoUnitario,
        subtotal
      })

      total += subtotal
    }

    const data = {
      supplierId: supplier.id,
      supplierNombre: supplier.nombre || '',
      fecha: payload.fecha,
      folio,
      comentarios: normalizeOptionalText(payload.comentarios) || '',
      status: 'DRAFT',
      items,
      total: round2(total),
      confirmedAt: null,
      confirmedBy: '',
      confirmedByUserId: '',
      createdBy: currentUser?.usuario || '',
      createdByUserId: currentUser?.sub || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const created = await recepcionesRepository.create(data)
    const sanitized = this.sanitizeRecepcion(created)

    await logAuditEvent({
      action: 'CREATE',
      resource: 'recepciones',
      resourceId: created.id,
      details: {
        folio: sanitized.folio,
        supplierNombre: sanitized.supplierNombre,
        status: sanitized.status,
        itemsCount: sanitized.items.length,
        total: sanitized.total
      },
      currentUser
    })

    return sanitized
  }

  async update(id, payload, currentUser = null) {
    const currentRecepcion = await recepcionesRepository.findById(id)

    if (!currentRecepcion) {
      const error = new Error('Recepción no encontrada')
      error.statusCode = 404
      throw error
    }

    if (currentRecepcion.status === 'CONFIRMED') {
      const error = new Error('No puedes editar una recepción confirmada')
      error.statusCode = 400
      throw error
    }

    const data = {
      updatedAt: new Date().toISOString()
    }

    // El folio no se puede modificar una vez asignado automáticamente

    if (payload.supplierId !== undefined) {
      const supplier = await recepcionesRepository.findSupplierById(payload.supplierId)

      if (!supplier) {
        const error = new Error('Proveedor no encontrado')
        error.statusCode = 404
        throw error
      }

      data.supplierId = supplier.id
      data.supplierNombre = supplier.nombre || ''
    }

    if (payload.fecha !== undefined) data.fecha = payload.fecha
    if (payload.comentarios !== undefined) data.comentarios = normalizeOptionalText(payload.comentarios) || ''

    if (payload.items !== undefined) {
      const items = []
      let total = 0

      for (const rawItem of payload.items) {
        const product = await recepcionesRepository.findProductById(rawItem.productId)

        if (!product) {
          const error = new Error(`Producto no encontrado: ${rawItem.productId}`)
          error.statusCode = 404
          throw error
        }

        const cantidad = Number(rawItem.cantidad)
        const costoUnitario = round2(rawItem.costoUnitario)
        const subtotal = round2(cantidad * costoUnitario)

        items.push({
          productId: product.id,
          sku: product.sku || '',
          productNombre: product.nombre || '',
          cantidad,
          costoUnitario,
          subtotal
        })

        total += subtotal
      }

      data.items = items
      data.total = round2(total)
    }

    const updated = await recepcionesRepository.update(id, data)
    const sanitized = this.sanitizeRecepcion(updated)

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'recepciones',
      resourceId: updated.id,
      details: {
        changes: Object.keys(payload),
        folio: sanitized.folio,
        status: sanitized.status,
        itemsCount: sanitized.items.length,
        total: sanitized.total
      },
      currentUser
    })

    return sanitized
  }

  async confirm(id, currentUser = null) {
    const recepcion = await recepcionesRepository.findById(id)

    if (!recepcion) {
      const error = new Error('Recepción no encontrada')
      error.statusCode = 404
      throw error
    }

    if (recepcion.status === 'CONFIRMED') {
      const error = new Error('La recepción ya fue confirmada')
      error.statusCode = 400
      throw error
    }

    if (!Array.isArray(recepcion.items) || recepcion.items.length === 0) {
      const error = new Error('La recepción no tiene partidas')
      error.statusCode = 400
      throw error
    }

    const movements = []

    for (const item of recepcion.items) {
      const product = await recepcionesRepository.findProductById(item.productId)

      if (!product) {
        const error = new Error(`Producto no encontrado: ${item.productId}`)
        error.statusCode = 404
        throw error
      }

      const stockAnterior = Number(product.stock || 0)
      const cantidad = Number(item.cantidad || 0)
      const stockNuevo = stockAnterior + cantidad

      await recepcionesRepository.updateProduct(product.id, {
        stock: stockNuevo,
        precioCompra: Number(item.costoUnitario || product.precioCompra || 0),
        updatedAt: new Date().toISOString()
      })

      const movement = await recepcionesRepository.createInventoryMovement({
        productId: product.id,
        sku: product.sku || '',
        productNombre: product.nombre || '',
        tipo: 'ENTRADA',
        cantidad,
        stockAnterior,
        stockNuevo,
        motivo: `Recepción ${recepcion.folio}`,
        referencia: recepcion.id,
        userId: currentUser?.sub || '',
        usuario: currentUser?.usuario || '',
        createdAt: new Date().toISOString()
      })

      movements.push(this.sanitizeMovement(movement))
    }

    const updatedRecepcion = await recepcionesRepository.update(recepcion.id, {
      status: 'CONFIRMED',
      confirmedAt: new Date().toISOString(),
      confirmedBy: currentUser?.usuario || '',
      confirmedByUserId: currentUser?.sub || '',
      updatedAt: new Date().toISOString()
    })

    await logAuditEvent({
      action: 'CONFIRM',
      resource: 'recepciones',
      resourceId: updatedRecepcion.id,
      details: {
        folio: updatedRecepcion.folio || '',
        supplierNombre: updatedRecepcion.supplierNombre || '',
        itemsCount: Array.isArray(updatedRecepcion.items) ? updatedRecepcion.items.length : 0,
        total: Number(updatedRecepcion.total || 0)
      },
      currentUser
    })

    return {
      message: 'Recepción confirmada correctamente',
      item: this.sanitizeRecepcion(updatedRecepcion),
      movements
    }
  }

  async remove(id, currentUser = null) {
    const recepcion = await recepcionesRepository.findById(id)

    if (!recepcion) {
      const error = new Error('Recepción no encontrada')
      error.statusCode = 404
      throw error
    }

    if (recepcion.status === 'CONFIRMED') {
      const error = new Error('No puedes eliminar una recepción confirmada')
      error.statusCode = 400
      throw error
    }

    await recepcionesRepository.remove(id)

    await logAuditEvent({
      action: 'DELETE',
      resource: 'recepciones',
      resourceId: id,
      details: {
        folio: recepcion.folio || '',
        supplierNombre: recepcion.supplierNombre || '',
        status: recepcion.status || ''
      },
      currentUser
    })

    return {
      success: true
    }
  }

  sanitizeRecepcion(recepcion) {
    return {
      id: recepcion.id,
      supplierId: recepcion.supplierId || '',
      supplierNombre: recepcion.supplierNombre || '',
      fecha: recepcion.fecha || '',
      folio: recepcion.folio || '',
      comentarios: recepcion.comentarios || '',
      status: recepcion.status || 'DRAFT',
      items: Array.isArray(recepcion.items)
        ? recepcion.items.map((item) => ({
            productId: item.productId || '',
            sku: item.sku || '',
            productNombre: item.productNombre || '',
            cantidad: Number(item.cantidad || 0),
            costoUnitario: Number(item.costoUnitario || 0),
            subtotal: Number(item.subtotal || 0)
          }))
        : [],
      total: Number(recepcion.total || 0),
      confirmedAt: recepcion.confirmedAt || null,
      confirmedBy: recepcion.confirmedBy || '',
      confirmedByUserId: recepcion.confirmedByUserId || '',
      createdBy: recepcion.createdBy || '',
      createdByUserId: recepcion.createdByUserId || '',
      createdAt: recepcion.createdAt || null,
      updatedAt: recepcion.updatedAt || null
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

export const recepcionesService = new RecepcionesService()