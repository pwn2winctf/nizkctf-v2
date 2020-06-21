import { Router, Request, Response, NextFunction } from 'express'
import { Database } from '../app'
import { check, validationResult } from 'express-validator'
import { ValidationError } from '../types/errors'

export default function users (database: Database): Router {
  const router = Router()

  router.post(
    '/',
    [
      check('email').isEmail(),
      check('password').isString(),
      check('displayName').isString()
    ],
    async (req: Request, res: Response, next:NextFunction) => {
      try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new ValidationError(errors)
        }

        const email: string = req.body.email
        const password: string = req.body.password
        const displayName: string = req.body.displayName

        const data = await database.users.register({
          email,
          password,
          displayName
        })
        return res.status(201).send(data)
      } catch (err) {
        next(err)
      }
    }
  )

  router.post(
    '/login',
    [check('email').isEmail(), check('password').isString()],
    async (req: Request, res: Response, next:NextFunction) => {
      try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new ValidationError(errors)
        }
        const email: string = req.body.email
        const password: string = req.body.password

        const data = await database.users.login({ email, password })
        return res.status(200).send(data)
      } catch (err) {
        next(err)
      }
    }
  )

  return router
}
