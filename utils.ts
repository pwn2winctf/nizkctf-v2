import { v4 as uuidv4 } from 'uuid'
import { createHash } from 'crypto'
import libsodium from 'libsodium-wrappers'

import { Database, Challenge } from './src/app'
import { cryptoSignSeedKeypair, cryptoSign } from './src/libsodium'

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
      const id = createHash('sha256')
        .update(name)
        .digest('hex')
      if (store.teams[id]) {
        throw Error('Already exists this team')
      }
      store.teams[id] = { name, countries, members }
      return { id, name, countries, members }
    },
    get: async id => {
      const item = store.teams[id]

      if (!item) {
        throw Error('Not found')
      }

      return { id, ...item }
    }
  }

  const users: Database['users'] = {
    register: async ({ email, password, displayName }) => {
      if (Object.values(store.users).some(user => user.email === email)) {
        throw Error('Already exists a user with this email')
      }

      const uuid = uuidv4()
      store.users[uuid] = { email, password, displayName }

      return { uuid, email, displayName }
    },
    current: async token => {
      const userData = store.users[token]
      if (!userData) {
        throw Error('User not found')
      }
      return { uuid: token, ...userData }
    },
    login: async ({ email, password }) => {
      const userEntries = Object.entries(store.users).find(
        item => item[1].email === email
      )
      if (!userEntries) {
        throw Error('Not exists a user with this email')
      }

      if (userEntries[1].password !== password) {
        throw Error('Wrong password')
      }

      const uuid = userEntries[0]
      const { displayName } = userEntries[1]

      return {
        user: { uuid, email, displayName },
        token: uuid,
        refreshToken: uuid
      }
    },
    get: (id: string) => Promise.resolve({ id })
  }

  const solves: Database['solves'] = {
    register: async (teamId, challengeId) => {
      const team = store.teams[teamId]
      if (!team) {
        throw new Error('Team not found')
      }

      const challenge = store.challenges[challengeId]
      if (!challenge) {
        throw new Error('Challenge not found')
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

/* async function cryptoPwhash (password:string, salt:Uint8Array, opslimit:number, memlimit:number):Promise<Uint8Array> {
  await libsodium.ready
  const hash = libsodium.crypto_pwhash(
    libsodium.crypto_sign_SEEDBYTES,
    password,
    salt,
    opslimit,
    memlimit,
    libsodium.crypto_pwhash_ALG_ARGON2ID13
  )

  return hash
} */

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
