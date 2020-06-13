import { Router, Request, Response } from 'express'
import { check, validationResult } from 'express-validator'
import { createHash } from 'crypto'

import { Database } from '../app'
import * as constants from '../../constants.json'
import { cryptoSignOpen } from '../libsodium'

export default function teams (database: Database): Router {
  const router = Router()

  router.post(
    '/',
    [
      check('name')
        .isString()
        .custom((name: string) => name.length > 0),
      check('countries')
        .isArray({ max: constants.maxCountriesFlag, min: 0 })
        .custom((countries: string[]) =>
          countries.every((item: string) => constants.countries.includes(item))
        )
    ],
    async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() })
      }

      const name: string = req.body.name
      const countries: string[] = req.body.countries
      try {
        const user = await database.users.current(req.headers.authorization!)

        const teamData = { name, countries, members: [user.uuid] }

        const data = await database.teams.register(teamData)

        return res.status(201).send(data)
      } catch (err) {
        res
          .status(400)
          .json({ errors: [{ code: 'semantic', message: err.message }] })
      }
    }
  )

  router.post(
    '/:teamId/solves',
    [
      check('challengeId')
        .isString()
        .custom((teamId: string) => teamId.length > 0),
      check('proof').isBase64()
    ],
    async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() })
      }

      const token = req.headers.authorization!
      const teamId: string = req.params.teamId
      const challengeId: string = req.body.challengeId
      const proof = Buffer.from(req.body.proof, 'base64')

      const user = await database.users.current(token)
      const team = await database.teams.get(teamId)
      const solves = await database.solves.get(teamId)

      if (!team.members.includes(user.uuid)) {
        return res.status(403).json({
          errors: [
            { code: 'semantic', message: "you don't belong on this team" }
          ]
        })
      }

      if (solves && solves[challengeId]) {
        return res.status(422).json({
          errors: {
            code: 'semantic',
            message: 'Your team already solved this challenge'
          }
        })
      }

      const challenge = await database.challenges.get(challengeId)

      const challengePk = Buffer.from(challenge.pk, 'base64')
      const sha = createHash('sha256')
        .update(team.name)
        .digest('hex')
      const claimedTeamNameSha = Buffer.from(
        await cryptoSignOpen(proof, challengePk)
      ).toString('ascii')

      if (claimedTeamNameSha !== sha) {
        return res
          .status(422)
          .json({ errors: { code: 'semantic', message: 'Invalid proof' } })
      }

      const data = await database.solves.register(teamId, challengeId)

      return res.status(200).send(data)
    }
  )

  return router
}
