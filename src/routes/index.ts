import { Router } from 'express'

import { Database } from '../app'

import teamsRouter from './teams.route'
import usersRouter from './users.route'
import scoreRouter from './score.route'

import { authenticatedScheme } from '../schemes'

import validate from '../middlewares/validation.middleware'

export default function (database: Database): Router {
  const router = Router()

  router.use('/teams', authenticatedScheme, validate, teamsRouter(database))
  router.use('/users', usersRouter(database))
  router.use('/score', scoreRouter(database))

  router.get('/', async (_, res) => {
    res.status(200).send('Good Luck')
  })

  return router
}
