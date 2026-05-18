// Catálogo central de permisos del sistema.
// Usar estas constantes en las rutas en lugar de strings literales para evitar errores
export const PERMS = {
  AUTH:        { ME: 'auth:me' },
  USERS:       { READ: 'users:read', CREATE: 'users:create', UPDATE: 'users:update', DELETE: 'users:delete' },
  ROLES:       { READ: 'roles:read', CREATE: 'roles:create', UPDATE: 'roles:update', DELETE: 'roles:delete' },
  PERMISSIONS: { READ: 'permissions:read', CREATE: 'permissions:create', UPDATE: 'permissions:update', DELETE: 'permissions:delete', SEED: 'permissions:seed' },
  CLIENTS:     { READ: 'clients:read', CREATE: 'clients:create', UPDATE: 'clients:update', DELETE: 'clients:delete' },
  SUPPLIERS:   { READ: 'suppliers:read', CREATE: 'suppliers:create', UPDATE: 'suppliers:update', DELETE: 'suppliers:delete' },
  PRODUCTS:    { READ: 'products:read', CREATE: 'products:create', UPDATE: 'products:update', DELETE: 'products:delete' },
  INVENTORY:   { READ: 'inventory:read', UPDATE: 'inventory:update' },
  RECEPCIONES: { READ: 'recepciones:read', CREATE: 'recepciones:create', UPDATE: 'recepciones:update', DELETE: 'recepciones:delete' },
  AUDIT:       { READ: 'audit:read', CREATE: 'audit:create' },
  DASHBOARD:   { READ: 'dashboard:read' }
}

// Lista de módulos funcionales del sistema.
export const MODULES = [
  'users', 'roles', 'permissions', 'clients', 'suppliers',
  'products', 'inventory', 'recepciones', 'audit', 'dashboard'
]
