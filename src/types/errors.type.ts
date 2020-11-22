import {
  Result,
  ValidationError as ValidationErrorArgs
} from 'express-validator'

class HttpError extends Error {
  public statusCode: number
  constructor (statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class ValidationError extends HttpError {
  public errors: ValidationErrorArgs[]

  constructor (args: Result<ValidationErrorArgs>) {
    super(422, 'Validation error')
    this.errors = args.array()
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class AuthorizationError extends HttpError {
  constructor (message: string, statusCode = 403) {
    super(statusCode, message)

    Object.setPrototypeOf(this, AuthorizationError.prototype)
  }
}

export class SemanticError extends HttpError {
  constructor (message: string, statusCode = 422) {
    super(statusCode, message)
    Object.setPrototypeOf(this, SemanticError.prototype)
  }
}

export class NotFoundError extends HttpError {
  constructor (message: string, statusCode = 404) {
    super(statusCode, message)
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}
