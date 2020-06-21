import { Router, Request, Response, NextFunction } from 'express'
import { check, validationResult } from 'express-validator'
import { createHash } from 'crypto'

import { Database } from '../app'
import * as constants from '../../constants.json'
import { cryptoSignOpen } from '../libsodium'
import { ValidationError, SemanticError, AuthorizationError } from '../types/errors'

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
    async (req: Request, res: Response, next:NextFunction) => {
      try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new ValidationError(errors)
        }

        const name: string = req.body.name
        const countries: string[] = req.body.countries
        const user = await database.users.current(req.headers.authorization!)

        const teamData = { name, countries, members: [user.uuid] }

        const data = await database.teams.register(teamData)

        return res.status(201).send(data)
      } catch (err) {
        next(err)
      }
    }
  )

  router.post(
    '/:teamId/solves',
    [
      check('challengeId')
        .isString(),
      check('proof').isBase64()
    ],
    async (req: Request, res: Response, next:NextFunction) => {
      try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new ValidationError(errors)
        }

        const token = req.headers.authorization!
        const teamId: string = req.params.teamId
        const challengeId: string = req.body.challengeId
        const proof = Buffer.from(req.body.proof, 'base64')

        const user = await database.users.current(token)
        const team = await database.teams.get(teamId)
        const solves = await database.solves.get(teamId)

        if (!team.members.includes(user.uuid)) {
          throw new AuthorizationError('you don\'t belong on this team')
        }

        if (solves && solves[challengeId]) {
          throw new SemanticError('Your team already solved this challenge')
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
          throw new SemanticError('Invalid proof')
        }

        const data = await database.solves.register(teamId, challengeId)

        return res.status(200).send(data)
      } catch (err) {
        if (err instanceof TypeError && err.message.includes('is too short')) {
          next(new SemanticError('Invalid proof'))
        } else {
          next(err)
        }
      }
    }
  )

  return router
}
