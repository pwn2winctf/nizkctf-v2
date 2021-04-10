import jwt from 'jsonwebtoken'
import { createHash } from 'crypto'
import libsodium from 'libsodium-wrappers'

import { Database, Challenge, Solves } from './src/app'
import { cryptoSignSeedKeypair, cryptoSign } from './src/libsodium'
import { SemanticError, NotFoundError } from './src/types/errors.type'
import { FIREBASE_CREDENTIALS } from './src/config'

export type APIError = {
  code: string
  message: string
  location?: string
  param?: string
}

export interface DatabaseStructure {
  teams: {
    [key: string]: {
      name: string
      countries: string[]
      members: string[]
    }
  }
  users: {
    [key: string]: {
      displayName: string
      email: string
      password: string
    }
  }
  solves: {
    [key: string]: {
      [key: string]: number
    }
  }
  challenges: {
    [id: string]: {
      id: string
      name: string
      pk: string
      salt: string
      opslimit: number
      memlimit: number
    }
  }
}

export function prepareDatabase (store: DatabaseStructure): Database {
  const teams: Database['teams'] = {
    register: async ({ name, countries, members }) => {
      if (members.length !== 1 || typeof members[0] !== 'string') {
        throw new Error('Members required')
      }
      const id = createHash('sha256')
        .update(name)
        .digest('hex')
      if (store.teams[id]) {
        throw new SemanticError('Already exists this team')
      }
      store.teams[id] = { name, countries, members }
      return { id, name, countries, members }
    },
    get: async id => {
      const item = store.teams[id]

      if (!item) {
        throw new NotFoundError('Not found')
      }

      return { id, ...item }
    },
    list: async () => {
      const teams = Object.entries(store.teams).map(([id, { name, countries }]) => ({ id, name, countries }))

      return teams
    }
  }

  const users: Database['users'] = {
    current: async token => {
      const userData = store.users[token]
      if (!userData) {
        throw new NotFoundError('User not found')
      }
      return { uid: token, ...userData }
    }
  }

  const solves: Database['solves'] = {
    all: async () => {
      const solves = Object.entries(store.solves).reduce(
        (obj: { [teamId: string]: Solves }, [teamId, challenges]) => {
          const teamSolves: Solves = { ...challenges }
          obj[teamId] = teamSolves

          return obj
        },
        {}
      )
      return solves
    },
    register: async (teamId, challengeId) => {
      const team = store.teams[teamId]
      if (!team) {
        throw new NotFoundError('Team not found')
      }

      const challenge = store.challenges[challengeId]
      if (!challenge) {
        throw new NotFoundError('Challenge not found')
      }

      const previousData = store.solves[teamId] || {}

      store.solves[teamId] = {
        ...previousData,
        [challengeId]: new Date().getTime()
      }
      return store.solves[teamId]
    },
    get: async teamId => {
      return store.solves[teamId]
    }
  }
  const challenges: Database['challenges'] = {
    all: async () => {
      return store.challenges
    },
    get: async id => {
      return store.challenges[id]
    }
  }

  return {
    teams,
    users,
    solves,
    challenges
  }
}

async function lookupFlag (flag: string, challenge: Challenge) {
  await libsodium.ready
  const decodedPk = Buffer.from(challenge.pk, 'base64')
  const decodedSalt: Uint8Array = Buffer.from(challenge.salt, 'base64')

  const { opslimit, memlimit } = challenge

  const challengeSeed = await libsodium.crypto_pwhash(
    libsodium.crypto_sign_SEEDBYTES,
    flag,
    decodedSalt,
    opslimit,
    memlimit,
    libsodium.crypto_pwhash_ALG_ARGON2ID13
  )
  const keys = await cryptoSignSeedKeypair(challengeSeed)

  if (decodedPk.compare(Buffer.from(keys.publicKey)) !== 0) {
    return null
  }

  return keys
}

async function createProof (teamNameSha: string, privateKey: Uint8Array) {
  const proof = await cryptoSign(teamNameSha, privateKey)
  return proof
}

export async function claimFlag (
  teamName: string,
  flag: string,
  challenge: Challenge
): Promise<string> {
  const keys = await lookupFlag(flag, challenge)

  if (!keys) {
    throw new Error('This is not the correct flag.')
  }

  const sha = createHash('sha256')
    .update(teamName)
    .digest('hex')

  const proof = await createProof(sha, keys.privateKey)

  const encodedProof = Buffer.from(proof).toString('base64')

  return encodedProof
}

export function createJWTToken ({ userId, email, verified, displayName }: { userId: string, email: string, verified: boolean, displayName: string }, privateKey?: string): string {
  const token = jwt.sign({ user_id: userId, display_name: displayName, email, verified }, privateKey || FIREBASE_CREDENTIALS.private_key, { algorithm: 'RS256' })

  return token
}
