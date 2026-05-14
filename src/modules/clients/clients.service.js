import { clientsRepository } from './clients.repository.js'
import { logAuditEvent } from '../../utils/audit.js'

function normalizeOptionalText(value) {
  if (value === undefined) return undefined
  if (value === null) return null

  const trimmed = String(value).trim()
  return trimmed === '' ? '' : trimmed
}

export class ClientsService {
  async list(query) {
    let {
      q = '',
      activo,
      page = 1,
      limit = 10
    } = query

    const allClients = await clientsRepository.findAll()
    let filtered = allClients

    if (q) {
      const term = q.trim().toLowerCase()
      filtered = filtered.filter((client) => {
        return (
          String(client.nombre || '').toLowerCase().includes(term) ||
          String(client.rfc || '').toLowerCase().includes(term) ||
          String(client.email || '').toLowerCase().includes(term) ||
          String(client.telefono || '').toLowerCase().includes(term) ||
          String(client.contacto || '').toLowerCase().includes(term) ||
          String(client.direccion || '').toLowerCase().includes(term)
        )
      })
    }

    if (typeof activo === 'string') {
      if (['true', 'false'].includes(activo)) {
        activo = activo === 'true'
      } else {
        activo = undefined
      }
    }
    if (typeof activo === 'boolean') {
      filtered = filtered.filter((client) => (client.activo ?? true) === activo)
    }

    filtered.sort((a, b) => {
      const aName = String(a.nombre || '').toLowerCase()
      const bName = String(b.nombre || '').toLowerCase()
      return aName.localeCompare(bName)
    })

    const total = filtered.length
    const start = (page - 1) * limit
    const end = start + limit
    const items = filtered.slice(start, end).map((client) => this.sanitizeClient(client))

    return {
      items,
      total,
      page,
      limit
    }
  }

  async getById(id) {
    const client = await clientsRepository.findById(id)

    if (!client) {
      const error = new Error('Cliente no encontrado')
      error.statusCode = 404
      throw error
    }

    return this.sanitizeClient(client)
  }

  async create(payload, currentUser = null) {
    const normalizedEmail = payload.email ? String(payload.email).trim().toLowerCase() : ''
    const normalizedRfc = payload.rfc ? String(payload.rfc).trim().toUpperCase() : ''

    if (normalizedEmail) {
      const existingByEmail = await clientsRepository.findByEmail(normalizedEmail)

      if (existingByEmail) {
        const error = new Error('El email del cliente ya existe')
        error.statusCode = 409
        throw error
      }
    }

    if (normalizedRfc) {
      const existingByRfc = await clientsRepository.findByRfc(normalizedRfc)

      if (existingByRfc) {
        const error = new Error('El RFC del cliente ya existe')
        error.statusCode = 409
        throw error
      }
    }

    const data = {
      nombre: payload.nombre.trim(),
      rfc: normalizedRfc || '',
      email: normalizedEmail || '',
      telefono: normalizeOptionalText(payload.telefono) || '',
      direccion: normalizeOptionalText(payload.direccion) || '',
      contacto: normalizeOptionalText(payload.contacto) || '',
      notas: normalizeOptionalText(payload.notas) || '',
      activo: payload.activo ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const created = await clientsRepository.create(data)
    const sanitized = this.sanitizeClient(created)

    await logAuditEvent({
      action: 'CREATE',
      resource: 'clients',
      resourceId: created.id,
      details: {
        nombre: sanitized.nombre,
        rfc: sanitized.rfc,
        email: sanitized.email,
        activo: sanitized.activo
      },
      currentUser
    })

    return sanitized
  }

  async update(id, payload, currentUser = null) {
    const currentClient = await clientsRepository.findById(id)

    if (!currentClient) {
      const error = new Error('Cliente no encontrado')
      error.statusCode = 404
      throw error
    }

    if (payload.email !== undefined) {
      const normalizedEmail = payload.email ? String(payload.email).trim().toLowerCase() : ''

      if (normalizedEmail && normalizedEmail !== String(currentClient.email || '').toLowerCase()) {
        const existingByEmail = await clientsRepository.findByEmail(normalizedEmail)

        if (existingByEmail && existingByEmail.id !== id) {
          const error = new Error('El email del cliente ya existe')
          error.statusCode = 409
          throw error
        }
      }
    }

    if (payload.rfc !== undefined) {
      const normalizedRfc = payload.rfc ? String(payload.rfc).trim().toUpperCase() : ''

      if (normalizedRfc && normalizedRfc !== String(currentClient.rfc || '').toUpperCase()) {
        const existingByRfc = await clientsRepository.findByRfc(normalizedRfc)

        if (existingByRfc && existingByRfc.id !== id) {
          const error = new Error('El RFC del cliente ya existe')
          error.statusCode = 409
          throw error
        }
      }
    }

    const data = {
      updatedAt: new Date().toISOString()
    }

    if (payload.nombre !== undefined) data.nombre = payload.nombre.trim()
    if (payload.rfc !== undefined) data.rfc = payload.rfc ? String(payload.rfc).trim().toUpperCase() : ''
    if (payload.email !== undefined) data.email = payload.email ? String(payload.email).trim().toLowerCase() : ''
    if (payload.telefono !== undefined) data.telefono = normalizeOptionalText(payload.telefono) || ''
    if (payload.direccion !== undefined) data.direccion = normalizeOptionalText(payload.direccion) || ''
    if (payload.contacto !== undefined) data.contacto = normalizeOptionalText(payload.contacto) || ''
    if (payload.notas !== undefined) data.notas = normalizeOptionalText(payload.notas) || ''
    if (payload.activo !== undefined) data.activo = payload.activo

    const updated = await clientsRepository.update(id, data)
    const sanitized = this.sanitizeClient(updated)

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'clients',
      resourceId: updated.id,
      details: {
        changes: Object.keys(payload),
        nombre: sanitized.nombre,
        rfc: sanitized.rfc,
        activo: sanitized.activo
      },
      currentUser
    })

    return sanitized
  }

  async toggleActive(id, activo, currentUser = null) {
    const currentClient = await clientsRepository.findById(id)

    if (!currentClient) {
      const error = new Error('Cliente no encontrado')
      error.statusCode = 404
      throw error
    }

    const updated = await clientsRepository.update(id, {
      activo,
      updatedAt: new Date().toISOString()
    })

    const sanitized = this.sanitizeClient(updated)

    await logAuditEvent({
      action: 'TOGGLE_ACTIVE',
      resource: 'clients',
      resourceId: updated.id,
      details: {
        nombre: sanitized.nombre,
        activo: sanitized.activo
      },
      currentUser
    })

    return sanitized
  }

  async remove(id, currentUser = null) {
    const currentClient = await clientsRepository.findById(id)

    if (!currentClient) {
      const error = new Error('Cliente no encontrado')
      error.statusCode = 404
      throw error
    }

    await clientsRepository.remove(id)

    await logAuditEvent({
      action: 'DELETE',
      resource: 'clients',
      resourceId: id,
      details: {
        nombre: currentClient.nombre || '',
        rfc: currentClient.rfc || ''
      },
      currentUser
    })

    return {
      success: true
    }
  }

  sanitizeClient(client) {
    return {
      id: client.id,
      nombre: client.nombre || '',
      rfc: client.rfc || '',
      email: client.email || '',
      telefono: client.telefono || '',
      direccion: client.direccion || '',
      contacto: client.contacto || '',
      notas: client.notas || '',
      activo: client.activo ?? true,
      createdAt: client.createdAt || null,
      updatedAt: client.updatedAt || null
    }
  }
}

export const clientsService = new ClientsService()