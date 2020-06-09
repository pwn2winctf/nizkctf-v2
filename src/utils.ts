import { Request, Response, NextFunction } from 'express'

export function authMiddleware (
  req: Request,
  res: Response,
  next: NextFunction
): Response | undefined {
  if (!req.headers.authorization) {
    return res.status(403).json({
      errors: [{ code: 'Authorization', message: 'No credentials sent!' }]
    })
  }
  next()
}
