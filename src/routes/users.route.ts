import { Router, Request, Response, NextFunction } from 'express'

import { Database } from '../app'

import { authenticatedScheme } from '../schemes'

import validate from '../middlewares/validation.middleware'
import { validateToken } from '../authorization'

export default function users (database: Database): Router {
  const router = Router()

  router.get(
    '/me',
    authenticatedScheme, validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.headers.authorization) {
          throw new Error('Authorization is required')
        }
        const token: string = req.headers.authorization
        await validateToken(token)

        const data = await database.users.current(token)
        res.status(200).send(data)
      } catch (err) {
        next(err)
      }
    }
  )

  return router
}
