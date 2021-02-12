import { NextFunction, Request, Response } from 'express'
import { validationResult } from 'express-validator'

import { MissingTokenError, ValidationError } from '../types/errors.type'

export default function validate (req: Request, _: Response, next: NextFunction): void {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    if (errors.array().some(item =>
      item.param === 'authorization' && item.msg === 'Invalid value' && item.location === 'headers'
    )) {
      next(new MissingTokenError('No credentials sent!'))
    } else {
      next(new ValidationError(errors))
    }
  } else {
    next()
  }
}
