export function validate(schema, target = 'body') {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req[target])

      if (!result.success) {
        const errors = {}

        for (const issue of result.error.issues) {
          const key = issue.path.join('.') || 'root'
          errors[key] = issue.message
        }

        return res.status(400).json({
          message: 'Error de validación',
          errors
        })
      }
      
      if (target === 'query') {
        req.validatedQuery = result.data
      } else {
        req[target] = result.data
      }

      Object.assign(req[target], result.data)
      next()
    } catch (error) {
      next(error)
    }
  }
}