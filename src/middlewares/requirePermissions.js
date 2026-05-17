import { auditService } from '../modules/audit/audit.service.js'

// Middleware de autorización por permisos.
// Recibe un array de permisos requeridos y verifica que el usuario autenticado los tenga todos.
// Si falta alguno, registra el intento denegado en auditoría y responde con 403.
export function requirePermissions(requiredPermissions = []) {
  return async (req, res, next) => {
    const user = req.user

    if (!user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Unauthorized'
      })
    }

    const userPermissions = Array.isArray(user.permissions) ? user.permissions : []
    const missing = requiredPermissions.filter((p) => !userPermissions.includes(p))

    if (missing.length > 0) {
      // Registrar el intento denegado sin bloquear la respuesta al cliente
      auditService.logDenied({
        userId: user.id,
        usuario: user.usuario,
        method: req.method,
        path: req.originalUrl,
        required: requiredPermissions,
        missing
      }).catch(() => { })

      return res.status(403).json({
        code: 'FORBIDDEN_MISSING_PERMISSION',
        message: 'You do not have the required permissions',
        required: requiredPermissions
      })
    }

    next()
  }
}