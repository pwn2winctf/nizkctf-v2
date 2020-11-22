import { Router, Request, Response, NextFunction } from 'express'

import { Database } from '../app'
import { loginUserScheme, newUserScheme } from '../schemes/users.scheme'
import validate from '../middlewares/validation.middleware'

export default function users (database: Database): Router {
  const router = Router()

  router.post(
    '/',
    newUserScheme,
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, password, displayName } = req.body

        const data = await database.users.register({
          email,
          password,
          displayName
        })
        res.status(201).send(data)
      } catch (err) {
        next(err)
      }
    }
  )

  router.post(
    '/login',
    loginUserScheme, validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, password } = req.body

        const data = await database.users.login({ email, password })
        res.status(200).send(data)
      } catch (err) {
        next(err)
      }
    }
  )

  return router
}
