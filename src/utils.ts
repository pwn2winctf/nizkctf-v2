import { Request, Response, NextFunction } from 'express'
import { AuthorizationError } from './types/errors'

export function authMiddleware (
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.headers.authorization) {
    next(new AuthorizationError('No credentials sent!', 401))
  } else {
    next()
  }
}
