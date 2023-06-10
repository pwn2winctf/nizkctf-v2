import { Router, Request, Response, NextFunction } from 'express'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import Redis from 'ioredis'
import Schnorrkel, { Key, KeyPair, PublicNonces, Signature } from '@lorhansohaky/schnorrkel.js'
import { v4 as uuidv4 } from 'uuid'

import { Database } from '../app'
import {
  SemanticError,
  AuthorizationError
} from '../types/errors.type'

import { authenticatedScheme, recaptchaScheme } from '../schemes'
import { newSolveScheme1, newSolveScheme2, newTeamScheme } from '../schemes/teams.scheme'

import validate from '../middlewares/validation.middleware'
import recaptchaMiddleware from '../middlewares/recaptcha.middleware'
import { validateToken } from '../authorization'

import { END_EVENT_DATE, START_EVENT_DATE, START_SUBSCRIPTION_DATE } from '../utils'
import { getCache, updateCache } from '../cache'
import { SERVER_SECRET } from '../config'

dayjs.extend(isBetween)

interface RedisItem {
  client: {
    publicKey: string
    publicNonce: {
      kPublic: string
      kTwoPublic: string
    }
  }
  server: {
    state: string
  }
}

export default function teams (database: Database, redis: Redis): Router {
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

        if (dayjs(START_SUBSCRIPTION_DATE).isAfter(dayjs())) {
          throw new SemanticError('Subscriptions not enabled!')
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
    '/:teamId/solves/:challengeId/steps/1',
    authenticatedScheme.concat(newSolveScheme1), validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.headers.authorization) {
          throw new Error('Authorization is required')
        }

        const token = req.headers.authorization

        const { uid } = await validateToken(token)

        if (!dayjs().isBetween(START_EVENT_DATE, END_EVENT_DATE)) {
          throw new SemanticError('Submissions not allowed!')
        }

        const teamId: string = req.params.teamId
        const challengeId: string = req.params.challengeId

        const team = await database.teams.get(teamId)
        const solves = await database.solves.get(teamId)
        const challenge = await database.challenges.get(challengeId)

        if (!challenge) {
          throw new SemanticError('Invalid challenge')
        }

        if (!team.members.includes(uid)) {
          throw new AuthorizationError("you don't belong on this team")
        }

        if (solves && solves[challengeId]) {
          throw new SemanticError('Your team already solved this challenge')
        }

        const serverKeyPair: KeyPair = KeyPair.fromJson(JSON.stringify(challenge.serverKeyPair))

        const sessionId = `${teamId}_${challengeId}_${uuidv4()}`

        const schnorrkelServer = new Schnorrkel()
        const serverPublicNonce = schnorrkelServer.generatePublicNonces(serverKeyPair.privateKey)

        const { kPublic, kTwoPublic, publicKey }: {
          kPublic: string,
          kTwoPublic: string,
          publicKey: string
        } = req.body

        const sessionData: RedisItem = {
          client: {
            publicKey,
            publicNonce: {
              kPublic,
              kTwoPublic
            }
          },
          server: {
            state: schnorrkelServer.toJson()
          }
        }

        redis.set(sessionId, JSON.stringify(sessionData), 'EX', 2 * 60) // set expiration to 2 minutes

        res.status(200).send({
          sessionId,
          serverPublicNonce: {
            kPublic: serverPublicNonce.kPublic.toHex(),
            kTwoPublic: serverPublicNonce.kTwoPublic.toHex()
          }
        })
      } catch (err) {
        if (err instanceof TypeError && err.message.includes('is too short')) {
          next(new SemanticError('Invalid proof'))
        } else {
          next(err)
        }
      }
    }
  )

  router.post(
    '/:teamId/solves/:challengeId/steps/2',
    authenticatedScheme.concat(newSolveScheme2), validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.headers.authorization) {
          throw new Error('Authorization is required')
        }
        const token = req.headers.authorization

        const { uid } = await validateToken(token)

        if (!dayjs().isBetween(START_EVENT_DATE, END_EVENT_DATE)) {
          throw new SemanticError('Submissions not allowed!')
        }

        const teamId: string = req.params.teamId
        const team = await database.teams.get(teamId)

        if (!team.members.includes(uid)) {
          throw new AuthorizationError("you don't belong on this team")
        }

        const challengeId: string = req.params.challengeId

        const challenge = await database.challenges.get(challengeId)

        if (!challenge) {
          throw new SemanticError('Invalid challenge')
        }

        const solves = await database.solves.get(teamId)

        if (solves && solves[challengeId]) {
          throw new SemanticError('Your team already solved this challenge')
        }

        const {
          sessionId,
          signature: clientSignature,
          message
        }: {
          sessionId: string,
          signature: string,
          message: string,
        } = req.body

        const partialSessionId = `${teamId}_${challengeId}_`

        if (!sessionId.startsWith(partialSessionId)) {
          throw new SemanticError('Invalid session')
        }

        const rawRedisData = await redis.get(sessionId)

        if (!rawRedisData) {
          throw new SemanticError('Invalid session')
        }

        await redis.del(sessionId)

        let prevState: RedisItem
        try {
          prevState = JSON.parse(rawRedisData)
        } catch (err) {
          throw new Error('Invalid session')
        }

        const serverKeyPair: KeyPair = KeyPair.fromJson(JSON.stringify(challenge.serverKeyPair))

        const schnorrkelServer = Schnorrkel.fromJson(prevState.server.state)
        const publicKeys = [Key.fromHex(prevState.client.publicKey), serverKeyPair.publicKey]
        const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys, SERVER_SECRET)

        const serverPrevPublicNonce = schnorrkelServer.getPublicNonces(serverKeyPair.privateKey)
        const serverPublicNonces: Array<PublicNonces> = [serverPrevPublicNonce, {
          kPublic: Key.fromHex(prevState.client.publicNonce.kPublic),
          kTwoPublic: Key.fromHex(prevState.client.publicNonce.kTwoPublic)
        }]
        const serverSignature = schnorrkelServer.multiSigSign(serverKeyPair.privateKey, message, combinedPublicKey, serverPublicNonces)
        const signatures = [Signature.fromHex(clientSignature), serverSignature.signature]
        const signaturesSummed = Schnorrkel.sumSigs(signatures)
        const result = Schnorrkel.verify(signaturesSummed, message, serverSignature.finalPublicNonce, combinedPublicKey.combinedKey)

        if (!result || message !== teamId) {
          throw new SemanticError('Invalid proof')
        }

        const proof = JSON.stringify({
          signature: signaturesSummed.toHex(),
          message,
          finalPublicNonce: serverSignature.finalPublicNonce.toHex()
        })
        const data = await database.solves.register(teamId, challengeId, proof)

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
        const cachedData = getCache(req)
        if (cachedData) {
          res.setHeader('Cache-Control', 'max-age=5, s-maxage=15, stale-while-revalidate, public')
          return res.status(200).send(cachedData)
        }

        const data = await database.teams.list()

        updateCache(5, data, req)

        res.setHeader('Cache-Control', 'max-age=5, s-maxage=15, stale-while-revalidate, public')
        return res.status(200).send(data)
      } catch (err) {
        next(err)
      }
    }
  )

  return router
}
