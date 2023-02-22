import { Router, Request, Response, NextFunction } from 'express'

import { Database, Team } from '../app'

import { authenticatedScheme } from '../schemes'
import { newUserScheme } from '../schemes/users.scheme'

import validate from '../middlewares/validation.middleware'
import { validateToken } from '../authorization'
import { getCacheWithAuth, updateCacheWithAuth } from '../cache'

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

        const cachedData = getCacheWithAuth<{ uid: string; team?: Omit<Team, 'members'> }>(req, uid)
        if (cachedData) {
          return res.status(200).send(cachedData)
        }

        const data = await database.users.current(uid)
        if (data.team) {
          const cacheDuration = 10 * 60 // 10 minutes
          updateCacheWithAuth(cacheDuration, data, req, uid)
        }
        res.status(200).send(data)
      } catch (err) {
        next(err)
      }
    }
  )

  return router
}
