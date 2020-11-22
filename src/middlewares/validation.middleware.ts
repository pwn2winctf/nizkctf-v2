import { NextFunction, Request, Response } from 'express'
import { validationResult } from 'express-validator'
import { ValidationError } from '../types/errors.type'

export default function validate (req: Request, _: Response, next:NextFunction):void {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    next(new ValidationError(errors))
  } else {
    next()
  }
}
