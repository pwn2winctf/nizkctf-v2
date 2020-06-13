import { Router, Request, Response } from 'express'
import { Database } from '../app'
import * as constants from '../../constants.json'
import { check, validationResult } from 'express-validator'
import libsodium from 'libsodium-wrappers'
import { cryptoSignOpen } from '../libsodium'
import { createHash } from 'crypto'

export default function teams (database: Database): Router {
  const router = Router()

  router.post(
    '/',
    [
      check('name')
        .isString()
        .custom((name: string) => name.length > 0),
      check('cryptPk')
        .isBase64()
        .custom(
          (cryptPk: string) =>
            Buffer.from(cryptPk, 'base64').toString('ascii').length ===
            libsodium.crypto_box_PUBLICKEYBYTES
        ),
      check('signPk')
        .isBase64()
        .custom(
          (signPk: string) =>
            Buffer.from(signPk, 'base64').toString('ascii').length ===
            libsodium.crypto_sign_PUBLICKEYBYTES
        ),
      check('signPk').isBase64(),
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
      const cryptPk: string = req.body.cryptPk
      const signPk: string = req.body.signPk

      const teamData = { name, countries, cryptPk, signPk }

      await database.teams.register(teamData)

      res.status(201).send(teamData)
    }
  )

  router.post(
    '/:teamId/solves',
    [
      check('challengeId')
        .isString()
        .custom((teamId: string) => teamId.length > 0),
      check('proof').isBase64()
      // .custom((proof: string) => Buffer.from(proof, 'base64').toString('hex').length === libsodium.crypto_box_PUBLICKEYBYTES)
    ],
    async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() })
      }

      // const user = await database.users.current(req.headers.authorization)

      const challengeId: string = req.body.challengeId
      const teamId: string = req.params.teamId
      const solves = await database.solves.get(teamId)

      if (solves && solves[challengeId]) {
        res.status(422).json({
          errors: {
            code: 'semantic',
            message: 'Your team already solved this challenge'
          }
        })
      }

      const proof = Buffer.from(req.body.proof, 'base64')
      const challenge = await database.challenges.get(challengeId)
      const team = await database.teams.get(teamId)

      const challengePk = Buffer.from(challenge.pk, 'base64')
      const sha = createHash('sha256')
        .update(team.name)
        .digest('hex')
      const claimedTeamNameSha = Buffer.from(
        await cryptoSignOpen(proof, challengePk)
      ).toString('ascii')

      if (claimedTeamNameSha !== sha) {
        res
          .status(422)
          .json({ errors: { code: 'semantic', message: 'Invalid proof' } })
      }

      const data = await database.solves.register(teamId, challengeId)

      res.status(200).send(data)
    }
  )

  return router
}