import { permissionsRepository } from './permissions.repository.js'
import { logAuditEvent } from '../../utils/audit.js'

const DEFAULT_PERMISSIONS = [
  { code: 'auth:me', nombre: 'Ver usuario autenticado', descripcion: 'Permite consultar el usuario autenticado', modulo: 'auth' },

  { code: 'users:read', nombre: 'Ver usuarios', descripcion: 'Permite listar y ver usuarios', modulo: 'users' },
  { code: 'users:create', nombre: 'Crear usuarios', descripcion: 'Permite crear usuarios', modulo: 'users' },
  { code: 'users:update', nombre: 'Editar usuarios', descripcion: 'Permite actualizar usuarios', modulo: 'users' },
  { code: 'users:delete', nombre: 'Eliminar usuarios', descripcion: 'Permite eliminar usuarios', modulo: 'users' },

  { code: 'roles:read', nombre: 'Ver roles', descripcion: 'Permite listar y ver roles', modulo: 'roles' },
  { code: 'roles:create', nombre: 'Crear roles', descripcion: 'Permite crear roles', modulo: 'roles' },
  { code: 'roles:update', nombre: 'Editar roles', descripcion: 'Permite actualizar roles', modulo: 'roles' },
  { code: 'roles:delete', nombre: 'Eliminar roles', descripcion: 'Permite eliminar roles', modulo: 'roles' },

  { code: 'permissions:read', nombre: 'Ver permisos', descripcion: 'Permite listar y ver permisos', modulo: 'permissions' },
  { code: 'permissions:create', nombre: 'Crear permisos', descripcion: 'Permite crear permisos', modulo: 'permissions' },
  { code: 'permissions:update', nombre: 'Editar permisos', descripcion: 'Permite actualizar permisos', modulo: 'permissions' },
  { code: 'permissions:delete', nombre: 'Eliminar permisos', descripcion: 'Permite eliminar permisos', modulo: 'permissions' },
  { code: 'permissions:seed', nombre: 'Sembrar permisos', descripcion: 'Permite sembrar permisos base', modulo: 'permissions' },

  { code: 'clients:read', nombre: 'Ver clientes', descripcion: 'Permite listar y ver clientes', modulo: 'clients' },
  { code: 'clients:create', nombre: 'Crear clientes', descripcion: 'Permite crear clientes', modulo: 'clients' },
  { code: 'clients:update', nombre: 'Editar clientes', descripcion: 'Permite actualizar clientes', modulo: 'clients' },
  { code: 'clients:delete', nombre: 'Eliminar clientes', descripcion: 'Permite eliminar clientes', modulo: 'clients' },

  { code: 'suppliers:read', nombre: 'Ver proveedores', descripcion: 'Permite listar y ver proveedores', modulo: 'suppliers' },
  { code: 'suppliers:create', nombre: 'Crear proveedores', descripcion: 'Permite crear proveedores', modulo: 'suppliers' },
  { code: 'suppliers:update', nombre: 'Editar proveedores', descripcion: 'Permite actualizar proveedores', modulo: 'suppliers' },
  { code: 'suppliers:delete', nombre: 'Eliminar proveedores', descripcion: 'Permite eliminar proveedores', modulo: 'suppliers' },

  { code: 'products:read', nombre: 'Ver productos', descripcion: 'Permite listar y ver productos', modulo: 'products' },
  { code: 'products:create', nombre: 'Crear productos', descripcion: 'Permite crear productos', modulo: 'products' },
  { code: 'products:update', nombre: 'Editar productos', descripcion: 'Permite actualizar productos', modulo: 'products' },
  { code: 'products:delete', nombre: 'Eliminar productos', descripcion: 'Permite eliminar productos', modulo: 'products' },

  { code: 'inventory:read', nombre: 'Ver inventario', descripcion: 'Permite consultar inventario', modulo: 'inventory' },
  { code: 'inventory:update', nombre: 'Actualizar inventario', descripcion: 'Permite ajustar inventario', modulo: 'inventory' },

  { code: 'orders:read', nombre: 'Ver órdenes', descripcion: 'Permite listar y ver órdenes', modulo: 'orders' },
  { code: 'orders:create', nombre: 'Crear órdenes', descripcion: 'Permite registrar órdenes', modulo: 'orders' },
  { code: 'orders:update', nombre: 'Editar órdenes', descripcion: 'Permite actualizar órdenes', modulo: 'orders' },
  { code: 'orders:delete', nombre: 'Eliminar órdenes', descripcion: 'Permite eliminar órdenes', modulo: 'orders' },

  { code: 'recepciones:read', nombre: 'Ver recepciones', descripcion: 'Permite listar y ver recepciones', modulo: 'recepciones' },
  { code: 'recepciones:create', nombre: 'Crear recepciones', descripcion: 'Permite registrar recepciones', modulo: 'recepciones' },
  { code: 'recepciones:update', nombre: 'Editar recepciones', descripcion: 'Permite actualizar recepciones', modulo: 'recepciones' },
  { code: 'recepciones:delete', nombre: 'Eliminar recepciones', descripcion: 'Permite eliminar recepciones', modulo: 'recepciones' },

  { code: 'audit:read', nombre: 'Ver auditoría', descripcion: 'Permite consultar la auditoría', modulo: 'audit' },
  { code: 'dashboard:read', nombre: 'Ver dashboard', descripcion: 'Permite consultar el dashboard', modulo: 'dashboard' }
]

export class PermissionsService {
  async list(query) {
    const {
      q = '',
      page = 1,
      limit = 50
    } = query

    const allPermissions = await permissionsRepository.findAll()

    let filtered = allPermissions

    if (q) {
      const term = q.trim().toLowerCase()

      filtered = filtered.filter((permission) => {
        return (
          String(permission.code || '').toLowerCase().includes(term) ||
          String(permission.nombre || '').toLowerCase().includes(term) ||
          String(permission.descripcion || '').toLowerCase().includes(term) ||
          String(permission.modulo || '').toLowerCase().includes(term)
        )
      })
    }

    filtered.sort((a, b) => {
      const aCode = String(a.code || '').toLowerCase()
      const bCode = String(b.code || '').toLowerCase()
      return aCode.localeCompare(bCode)
    })

    const total = filtered.length
    const start = (page - 1) * limit
    const end = start + limit
    const items = filtered.slice(start, end).map((permission) => this.sanitizePermission(permission))

    return {
      items,
      total,
      page,
      limit
    }
  }

  async getById(id) {
    const permission = await permissionsRepository.findById(id)

    if (!permission) {
      const error = new Error('Permiso no encontrado')
      error.statusCode = 404
      throw error
    }

    return this.sanitizePermission(permission)
  }

  async create(payload, currentUser = null) {
    const existing = await permissionsRepository.findByCode(payload.code)

    if (existing) {
      const error = new Error('El permiso ya existe')
      error.statusCode = 409
      throw error
    }

    const data = {
      code: payload.code,
      nombre: payload.nombre,
      descripcion: payload.descripcion || '',
      modulo: payload.modulo || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const created = await permissionsRepository.create(data)
    const sanitized = this.sanitizePermission(created)

    await logAuditEvent({
      action: 'CREATE',
      resource: 'permissions',
      resourceId: created.id,
      details: {
        code: sanitized.code,
        nombre: sanitized.nombre,
        modulo: sanitized.modulo
      },
      currentUser
    })

    return sanitized
  }

  async update(id, payload, currentUser = null) {
    const currentPermission = await permissionsRepository.findById(id)

    if (!currentPermission) {
      const error = new Error('Permiso no encontrado')
      error.statusCode = 404
      throw error
    }

    if (payload.code && payload.code !== currentPermission.code) {
      const existing = await permissionsRepository.findByCode(payload.code)

      if (existing && existing.id !== id) {
        const error = new Error('El permiso ya existe')
        error.statusCode = 409
        throw error
      }
    }

    const data = {
      updatedAt: new Date().toISOString()
    }

    if (payload.code !== undefined) data.code = payload.code
    if (payload.nombre !== undefined) data.nombre = payload.nombre
    if (payload.descripcion !== undefined) data.descripcion = payload.descripcion
    if (payload.modulo !== undefined) data.modulo = payload.modulo

    const updated = await permissionsRepository.update(id, data)
    const sanitized = this.sanitizePermission(updated)

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'permissions',
      resourceId: updated.id,
      details: {
        changes: Object.keys(payload),
        code: sanitized.code,
        nombre: sanitized.nombre,
        modulo: sanitized.modulo
      },
      currentUser
    })

    return sanitized
  }

  async remove(id, currentUser = null) {
    const currentPermission = await permissionsRepository.findById(id)

    if (!currentPermission) {
      const error = new Error('Permiso no encontrado')
      error.statusCode = 404
      throw error
    }

    await permissionsRepository.remove(id)

    await logAuditEvent({
      action: 'DELETE',
      resource: 'permissions',
      resourceId: id,
      details: {
        code: currentPermission.code || '',
        nombre: currentPermission.nombre || ''
      },
      currentUser
    })

    return { success: true }
  }

  async seed(currentUser = null) {
    const seeded = []

    for (const item of DEFAULT_PERMISSIONS) {
      const data = {
        code: item.code,
        nombre: item.nombre,
        descripcion: item.descripcion || '',
        modulo: item.modulo || '',
        updatedAt: new Date().toISOString()
      }

      const existing = await permissionsRepository.findByCode(item.code)

      if (existing) {
        const updated = await permissionsRepository.update(existing.id, data)
        seeded.push(this.sanitizePermission(updated))
        continue
      }

      const created = await permissionsRepository.createWithId(item.code, {
        ...data,
        createdAt: new Date().toISOString()
      })

      seeded.push(this.sanitizePermission(created))
    }

    await logAuditEvent({
      action: 'SEED',
      resource: 'permissions',
      resourceId: '',
      details: {
        total: seeded.length
      },
      currentUser
    })

    return {
      message: 'Permisos sembrados correctamente',
      items: seeded,
      total: seeded.length
    }
  }

  sanitizePermission(permission) {
    return {
      id: permission.id,
      code: permission.code || '',
      nombre: permission.nombre || '',
      descripcion: permission.descripcion || '',
      modulo: permission.modulo || '',
      createdAt: permission.createdAt || null,
      updatedAt: permission.updatedAt || null
    }
  }
}

export const permissionsService = new PermissionsService()