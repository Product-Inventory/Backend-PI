import { authService } from './auth.service.js'

export class AuthController {
  async login(req, res) {
    const result = await authService.login(req.body)

    return res.status(200).json(result)
  }

  async me(req, res) {
    // req.user.id viene del middleware authenticate
    const userId = req.user?.id

    const user = await authService.me(userId)

    return res.status(200).json({ user })
  }

  // Devuelve los módulos accesibles al usuario con flags de acciones (canRead, canCreate, etc.)
  // para que en el frontend rendericen el menú lateral y oculten los botones según los permisos ;P
  async menu(req, res) {
    const permissions = req.user?.permissions || []
    const modules = authService.buildMenu(permissions)

    return res.status(200).json({ modules })
  }
}

export const authController = new AuthController()