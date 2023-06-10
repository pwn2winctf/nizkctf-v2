import { Router, Request, Response, NextFunction } from 'express'

import { Database } from '../app'
import { getCache, updateCache } from '../cache'

export default function audit (database: Database): Router {
  const router = Router()

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cachedData = getCache(req)
      if (cachedData) {
        res.setHeader('Cache-Control', 'max-age=5, s-maxage=15, stale-while-revalidate, public')
        return res.status(200).send(cachedData)
      }

      const solves = await database.solves.allWithProof()

      const mappedSolves = solves.map(({ moment, ...solve }) => ({
        ...solve,
        time: moment
      }))

      updateCache(5, mappedSolves, req)

      res.setHeader('Cache-Control', 'max-age=5, s-maxage=15, stale-while-revalidate, public')
      return res.status(200).json(mappedSolves)
    } catch (err) {
      next(err)
    }
  })

  return router
}
