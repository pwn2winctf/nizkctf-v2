import { Router, Request, Response } from 'express'
import { Database } from '../app'
import { check, validationResult } from 'express-validator'

export default function users (database: Database): Router {
  const router = Router()

  router.post(
    '/',
    [
      check('email').isEmail(),
      check('password').isString(),
      check('displayName').isString()
    ],
    async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() })
      }
      const email: string = req.body.email
      const password: string = req.body.password
      const displayName: string = req.body.displayName

      try {
        const data = await database.users.register({
          email,
          password,
          displayName
        })
        res.status(201).send(data)
      } catch (err) {
        res.status(400).json({ errors: [err] })
      }
    }
  )

  router.post(
    '/login',
    [check('email').isEmail(), check('password').isString()],
    async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() })
      }
      const email: string = req.body.email
      const password: string = req.body.password

      try {
        const data = await database.users.login({ email, password })
        res.status(200).send(data)
      } catch (err) {
        res.status(400).json({ errors: [err] })
      }
    }
  )

  return router
}
