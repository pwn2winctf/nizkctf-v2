import { Router, Request, Response, NextFunction } from 'express'
import apiCache from 'apicache'

import { Database } from '../app'

const cache = apiCache.middleware

export default function challenges (database: Database): Router {
  const router = Router()

  router.get('/', cache('10 seconds'), async (_: Request, res: Response, next: NextFunction) => {
    try {
      const challenges = Object.values(await database.challenges.all())

      res.status(200).json(challenges)
    } catch (err) {
      next(err)
    }
  })

  router.get(
    '/:challengeId', cache('10 seconds'), async (req: Request, res: Response, next: NextFunction) => {
      try {
        const challengeId: string = req.params.challengeId

        const challenge = await database.challenges.get(challengeId)

        res.status(200).send(challenge)
      } catch (err) {
        next(err)
      }
    }
  )

  return router
}
