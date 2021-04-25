import { Router, Request, Response, NextFunction } from 'express'
import { createHash } from 'crypto'

import { Database } from '../app'
import { cryptoSignOpen } from '../libsodium'
import {
  SemanticError,
  AuthorizationError
} from '../types/errors.type'

import { authenticatedScheme, recaptchaScheme } from '../schemes'
import { newSolveScheme, newTeamScheme } from '../schemes/teams.scheme'

import validate from '../middlewares/validation.middleware'
import recaptchaMiddleware from '../middlewares/recaptcha.middleware'
import { validateToken } from '../authorization'

export default function teams (database: Database): Router {
  const router = Router()

  router.post(
    '/',
    authenticatedScheme.concat(newTeamScheme.concat(recaptchaScheme)), validate, recaptchaMiddleware, async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.headers.authorization) {
          throw new Error('Authorization is required')
        }

        const token: string = req.headers.authorization

        const { uid, verified } = await validateToken(token)

        if (!verified) {
          throw new SemanticError('E-mail not verified!')
        }

        const name: string = req.body.name
        const countries: string[] = req.body.countries

        const teamData = { name, countries, members: [uid] }

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
        if (!req.headers.authorization) {
          throw new Error('Authorization is required')
        }
        const token = req.headers.authorization

        const { uid } = await validateToken(token)

        const teamId: string = req.params.teamId
        const challengeId: string = req.body.challengeId
        const proof = Buffer.from(req.body.proof, 'base64')

        const team = await database.teams.get(teamId)
        const solves = await database.solves.get(teamId)

        if (!team.members.includes(uid)) {
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

        const data = await database.solves.register(teamId, challengeId, req.body.proof)
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

  router.get(
    '/', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await database.teams.list()

        res.setHeader('Cache-Control', 'max-age=5, s-maxage=15, stale-while-revalidate, public')
        res.status(200).send(data)
      } catch (err) {
        next(err)
      }
    }
  )

  return router
}
