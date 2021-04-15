import { Router, Request, Response, NextFunction } from 'express'

import { Database } from '../app'

import { authenticatedScheme } from '../schemes'
import { newUserScheme } from '../schemes/users.scheme'

import validate from '../middlewares/validation.middleware'
import { validateToken } from '../authorization'

export default function users (database: Database): Router {
  const router = Router()

  router.post(
    '/',
    authenticatedScheme, newUserScheme, validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.headers.authorization) {
          throw new Error('Authorization is required')
        }
        const token: string = req.headers.authorization
        const { uid } = await validateToken(token)

        const { shareInfo }: { shareInfo: boolean } = req.body

        await database.users.register({ uid, shareInfo })
        res.sendStatus(201)
      } catch (err) {
        next(err)
      }
    }
  )

  router.get(
    '/me',
    authenticatedScheme, validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.headers.authorization) {
          throw new Error('Authorization is required')
        }
        const token: string = req.headers.authorization
        const { uid } = await validateToken(token)

        const data = await database.users.current(uid)
        res.status(200).send(data)
      } catch (err) {
        next(err)
      }
    }
  )

  return router
}
