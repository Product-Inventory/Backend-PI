import { verifyAccessToken } from '../config/jwt.js'
import { authRepository } from '../modules/auth/auth.repository.js'
import { rolesRepository } from '../modules/roles/roles.repository.js'

// Middleware de autenticación.
// Verifica el token JWT y recarga los permisos del ROLE del usuario desde Firestore en cada request.
// La fuente de verdad de los permisos es el rol, no el usuario.
// Esto garantiza que cambios en los permisos del rol surtan efecto inmediatamente para todos los usuarios.
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 'MISSING_TOKEN',
        message: 'No autorizado'
      })
    }

    const token = authHeader.split(' ')[1]
    // Solo usamos el JWT para identificar al usuario (sub); los permisos se leen desde el rol
    const decoded = verifyAccessToken(token)

    const user = await authRepository.findById(decoded.sub)

    if (!user) {
      return res.status(401).json({
        code: 'USER_NOT_FOUND',
        message: 'User not found' 
      })
    }

    if (user.activo === false) {
      return res.status(403).json({ code: 'USER_INACTIVE', message: 'User Inactive' })
    }

    // Leer los permisos desde el rol
    let permissions = []
    if (user.roleId) {
      // Buscar el rol del usuario para obtener los permisos
      const role = await rolesRepository.findById(user.roleId)
      permissions = Array.isArray(role?.permissions) ? role.permissions : []
    }

    // Ahora si adjuntar toda la info del usuario al request, 
    // incluyendo los permisos recargados desde el rol
    req.user = {
      id: user.id,
      usuario: user.usuario,
      role: user.role || null,
      roleId: user.roleId || null,
      permissions,
      activo: user.activo ?? true
    }

    next()
  } catch (error) {
    return res.status(401).json({
      code: 'INVALID_TOKEN',
      message: 'Invalid Token or Expired'
    })
  }
}