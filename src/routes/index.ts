import { Router } from 'express'
import { Redis } from 'ioredis'

import { Database } from '../app'

import auditRouter from './audit.route'
import teamsRouter from './teams.route'
import usersRouter from './users.route'
import scoreRouter from './score.route'

export default function (database: Database, redis: Redis): Router {
  const router = Router()

  router.use('/audit', auditRouter(database))
  router.use('/teams', teamsRouter(database, redis))
  router.use('/users', usersRouter(database))
  router.use('/score', scoreRouter(database))

  router.get('/', async (_, res) => {
    res.status(200).send('Good Luck')
  })

  return router
}
