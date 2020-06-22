import { Request, Response, NextFunction } from 'express'
import { AuthorizationError } from './types/errors'
import { dynamic_scoring as dynamicScore } from '../constants.json'

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

export function computeScore (numberOfSolves:number):number {
  const { K, V, minpts, maxpts } = dynamicScore

  return Math.trunc(
    Math.max(
      minpts,
      Math.floor(maxpts - K * Math.log2((numberOfSolves + V) / (1 + V)))
    )
  )
}
