import { Router, Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { createHash } from 'crypto'

import { Database } from '../app'
import { cryptoSignOpen } from '../libsodium'
import {
  ValidationError,
  SemanticError,
  AuthorizationError
} from '../types/errors.type'

import { authenticatedScheme, recaptchaScheme } from '../schemes'
import { newSolveScheme, newTeamScheme } from '../schemes/teams.scheme'

import validate from '../middlewares/validation.middleware'
import recaptchaMiddleware from '../middlewares/recaptcha.middleware'

export default function teams (database: Database): Router {
  const router = Router()

  router.post(
    '/',
    newTeamScheme.concat(recaptchaScheme), validate, recaptchaMiddleware, async (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new ValidationError(errors)
        }

        if (!req.headers.authorization) {
          throw new Error('Authorization is required')
        }

        const name: string = req.body.name
        const countries: string[] = req.body.countries
        const token:string = req.headers.authorization
        const user = await database.users.current(token)

        const teamData = { name, countries, members: [user.uuid] }

        const data = await database.teams.register(teamData)

        res.status(201).send(data)
      } catch (err) {
        next(err)
      }
    }
  )

  router.post(
    '/:teamId/solves',
    authenticatedScheme.concat(newSolveScheme), validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new ValidationError(errors)
        }

        if (!req.headers.authorization) {
          throw new Error('Authorization is required')
        }

        const token = req.headers.authorization
        const teamId: string = req.params.teamId
        const challengeId: string = req.body.challengeId
        const proof = Buffer.from(req.body.proof, 'base64')

        const user = await database.users.current(token)
        const team = await database.teams.get(teamId)
        const solves = await database.solves.get(teamId)

        if (!team.members.includes(user.uuid)) {
          throw new AuthorizationError("you don't belong on this team")
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
        res.status(200).send(data)
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
