export function errorHandler(error, req, res, next) {
  console.error('ERROR =>', error)
  console.error('Stack =>', error.stack)

  const status = error.statusCode || 500
  const message = error.message || 'Error interno del servidor'

  return res.status(status).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  })
}