import { Router } from 'express'

import { Database } from '../app'
import teams from './teams'
import users from './users'
import { authMiddleware } from '../utils'

export default function (database: Database): Router {
  const router = Router()

  router.use('/teams', authMiddleware, teams(database))
  router.use('/users', users(database))

  router.get('/', async (req, res) => {
    res.send('Good Luck')
  })

  return router
}
