import { Express, Request, Response, NextFunction } from 'express'
import { ValidationError, AuthorizationError, SemanticError, NotFoundError } from '../types/errors'

interface ArgsInterface {
 (err: Error, req: Request, res: Response<BodyOutput>, next: NextFunction): OutputErrors
}

type OutputErrors = Response<BodyOutput> | undefined

interface BodyOutput {
  errors: ErrorItem[] | ValidationErrorItem[]
}

interface ErrorItem {
  code: string,
  message: string,

}

interface ValidationErrorItem extends ErrorItem{
  location: 'body' | 'cookies' | 'headers' | 'params' | 'query' | undefined
  param:string
}

const validationErrorHandler:ArgsInterface = (err, req, res, next) => {
  if (err instanceof ValidationError) {
    const errors:ValidationErrorItem[] = err.errors.map((item):ValidationErrorItem => ({ code: 'validation', message: item.msg, location: item.location, param: item.param }))
    return res.status(err.statusCode).json({ errors })
  }

  next(err)
}

const authorizationErrorHandler: ArgsInterface = (err, req, res, next) => {
  if (err instanceof AuthorizationError) {
    const error:ErrorItem = { code: 'authorization', message: err.message }
    return res.status(err.statusCode).json({ errors: [error] })
  }

  next(err)
}

const semanticErrorHandler:ArgsInterface = (err, req, res, next) => {
  if (err instanceof SemanticError) {
    return res.status(err.statusCode).json({ errors: [{ code: 'semantic', message: err.message }] })
  }

  next(err)
}

const notFoundErrorHandler: ArgsInterface = (err, req, res, next) => {
  if (err instanceof NotFoundError) {
    return res.status(err.statusCode).json({ errors: [{ code: 'not-found', message: err.message }] })
  }

  next(err)
}

const errorHandlerWrapper = (app:Express):Express => {
  app.use(authorizationErrorHandler)
  app.use(validationErrorHandler)
  app.use(semanticErrorHandler)
  app.use(notFoundErrorHandler)

  app.use((err:Error, req:Request, res:Response, next:NextFunction) => {
    console.error(err)
    res
      .status(500)
      .json({ errors: [{ code: 'internal', message: 'Internal server error' }] })
  })

  return app
}
export default errorHandlerWrapper
