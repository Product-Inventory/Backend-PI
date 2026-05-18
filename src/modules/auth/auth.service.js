import bcrypt from 'bcryptjs'
import { signAccessToken } from '../../config/jwt.js'
import { authRepository } from './auth.repository.js'
import { MODULES } from '../../constants/permissions.js'

export class AuthService {
  async login(payload) {
    const { usuario, password } = payload

    const user = await authRepository.findByUsuario(usuario)

    if (!user) {
      const error = new Error('Credenciales inválidas')
      error.statusCode = 401
      throw error
    }

    if (user.activo === false) {
      const error = new Error('Usuario inactivo')
      error.statusCode = 403
      throw error
    }

    const passwordHash = user.passwordHash || user.password

    if (!passwordHash) {
      const error = new Error('El usuario no tiene contraseña configurada')
      error.statusCode = 500
      throw error
    }

    const isValidPassword = await bcrypt.compare(password, passwordHash)

    if (!isValidPassword) {
      const error = new Error('Credenciales inválidas')
      error.statusCode = 401
      throw error
    }

    // El JWT solo lleva sub para identificar al usuario; los permisos se releen desde Firestore en cada request
    const token = signAccessToken({
      sub: user.id,
      usuario: user.usuario,
      role: user.role || null,
      roleId: user.roleId || null,
      permissions: Array.isArray(user.permissions) ? user.permissions : []
    })

    return {
      token,
      user: this.sanitizeUser(user)
    }
  }

  async me(userId) {
    const user = await authRepository.findById(userId)

    if (!user) {
      const error = new Error('Usuario no encontrado')
      error.statusCode = 404
      throw error
    }

    if (user.activo === false) {
      const error = new Error('Usuario inactivo')
      error.statusCode = 403
      throw error
    }

    return this.sanitizeUser(user)
  }

  // Construye la lista de módulos accesibles con flags de acciones para el frontend.
  // Solo incluye módulos donde el usuario tiene al menos un permiso.
  buildMenu(permissions = []) {
    const has = (p) => permissions.includes(p)

    return MODULES
      .map((code) => ({
        code,
        canRead:   has(`${code}:read`),
        canCreate: has(`${code}:create`),
        canUpdate: has(`${code}:update`),
        canDelete: has(`${code}:delete`)
      }))
      .filter((m) => m.canRead || m.canCreate || m.canUpdate || m.canDelete)
  }

  sanitizeUser(user) {
    return {
      id: user.id,
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      email: user.email || '',
      usuario: user.usuario || '',
      role: user.role || null,
      roleId: user.roleId || null,
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
      activo: user.activo ?? true
    }
  }
}

export const authService = new AuthService()