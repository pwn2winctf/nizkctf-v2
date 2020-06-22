import { Router } from 'express'

import { Database } from '../app'
import teamsRouter from './teams'
import usersRouter from './users'
import scoreRouter from './score'
import { authMiddleware } from '../utils'

export default function (database: Database): Router {
  const router = Router()

  router.use('/teams', authMiddleware, teamsRouter(database))
  router.use('/users', usersRouter(database))
  router.use('/score', scoreRouter(database))

  router.get('/', async (req, res) => {
    res.status(200).send('Good Luck')
  })

  return router
}
