import request from 'supertest'

import {
  prepareDatabase,
  DatabaseStructure,
  claimFlag,
  APIError,
  createJWTToken
} from '../../utils'
import app from '../../src/app'
import { getUserDataFromJWT } from '../../src/utils'

const initialState: DatabaseStructure = {
  teams: {},
  users: {},
  solves: {},
  challenges: {
    test: {
      id: 'test',
      name: 'Desafio teste',
      pk: 'AwTtUaLtzpHyxVY0oQvEP398tPPK8iLKjsjgmvjn+y8=',
      salt: 'KoVNy6Blq3vFpmdgAXO9MQ==',
      opslimit: 2,
      memlimit: 67108864
    }
  }
}

const store: DatabaseStructure = Object.create(initialState)

const user = {
  uid: '',
  email: 'lorhan@mailinator.com',
  displayName: 'Lorhan Sohaky',
  password: '123456'
}

let token = ''

const challengeId = 'test'

let team = {
  id: '',
  name: 'Team test',
  countries: ['br', 'us', 'jp', 'zw', 'pt']
}

let team2 = {
  id: '',
  name: 'Team test2',
  countries: ['br', 'us', 'jp', 'zw', 'pt']
}

describe('Teams solves', () => {
  beforeEach(async () => {
    store.users = { ...initialState.users }
    store.teams = { ...initialState.teams }
    store.solves = { ...initialState.solves }

    const database = prepareDatabase(store)

    const { uid } = await database.users.register(user)
    const data = await database.users.login(user)
    token = data.token
    user.uid = uid

    team = await database.teams.register({ ...team, members: [user.uid] })
    team2 = await database.teams.register({
      ...team2,
      members: ['random_uuid']
    })
    team = { ...team }
    team2 = { ...team2 }
  })

  it('Should submit flag', async () => {
    const database = prepareDatabase(store)

    const challenge = await database.challenges.get(challengeId)
    const proof = await claimFlag(team.name, 'CTF-BR{123}', challenge)

    const data = {
      proof,
      challengeId
    }

    const { status } = await request(app({ database }))
      .post(`/teams/${team.id}/solves`)
      .set({ Authorization: token })
      .set('content-type', 'application/json')
      .send(data)

    expect(status).toBe(200)
  })

  it('Should not accept submission without a valid token', async () => {
    const database = prepareDatabase(store)

    const challenge = await database.challenges.get(challengeId)
    const proof = await claimFlag(team.name, 'CTF-BR{123}', challenge)

    const data = {
      proof,
      challengeId
    }

    const { uid, email, displayName } = await getUserDataFromJWT(token)

    const wrongPrivateKey = '-----BEGIN RSA PRIVATE KEY-----\nMIICXAIBAAKBgQC+uQGmgtlFkJ330HiV7p8aRv0gvL22i0H683/udK9BVNXbNad7\nYKuepUUFldF9nWmcNncEz/Mhe6B+rGeyYLLY67QPEJjHDpoTbGNqnKdZRI+sLKdl\nbdNWM73RzhSYRNil8h7EuKzCbWF8D61faUZtXX/t7xYsVql0iOy3OpYuWQIDAQAB\nAoGBAL2carKjVeTeMN6FyMyurkjOmKtqWWXZLuCSIvbr1Kyr7e0Ae6CibBzODD/Q\nQbSTwcJHN652Gy6HnPky5+kkT8i3pWKeq336l24lsLy3xlNUjbOFi/ixu2/+LH4X\nE8WA6K6KRgw41rG46/3gTL9F0grak08KVBI4fJwfxxQLuAPtAkEA4RtFd9EAt5qb\nhfuSSp/2R6o2rXzCNzFNAti/iTfiL1tBREFvMt1bVGpWrmzAAiRYTV21NKIb9GQ3\nygi0ncNSKwJBANjlt9NGuJ9/9mWMLv6DC+xw8AE+vOMjpFs2kUtXfjyxjdwytBSn\nE4T2KR2FMeKSeqq7JLQDXhxkaIapHyV+M4sCQBw04puE4OYgxWQghdA8Awwv0/Ih\nM+TelJvKtRVonzr34FHBMUHaYttNB9eLYPPjwfzPxSj3NzGEbUkvlhI+q0kCQH2Q\nX18cbf1IYyheg0YsL1bt+sN9wnPsSlXTvUFUoWwZjfqQD9h08MPkjeDdHwf/rKvy\nM0lTOcRODIUIm1NlQAkCQEvzLUARO5tKUHwt87kUISugtKo2+HDe+5DSjUW0m4Ih\nlo1uYRoOjqR0QZSv2wqFnH7fiJzYsvpQicIm+ZwOQg0=\n-----END RSA PRIVATE KEY-----'

    const invalidToken = createJWTToken({ userId: uid, email, displayName: displayName, verified: true }, wrongPrivateKey)

    const { status, body } = await request(app({ database }))
      .post(`/teams/${team.id}/solves`)
      .set({ Authorization: invalidToken })
      .set('content-type', 'application/json')
      .send(data)

    expect(status).toBe(403)
    const firstError: APIError = body.errors[0]
    expect(firstError.code).toBe('authorization')
    expect(firstError.message).toBe('Invalid token')
  })

  it('Should not accept submission without challengeId', async () => {
    const database = prepareDatabase(store)

    const challenge = await database.challenges.get(challengeId)
    const proof = await claimFlag(team.name, 'CTF-BR{123}', challenge)

    const data = { proof }

    const { status, body } = await request(app({ database }))
      .post(`/teams/${team.id}/solves`)
      .set({ Authorization: token })
      .set('content-type', 'application/json')
      .send(data)

    const firstError: APIError = body.errors[0]
    expect(status).toBe(422)
    expect(firstError.param).toBe('challengeId')
  })

  it('Should not accept submission without proof', async () => {
    const database = prepareDatabase(store)

    const data = { challengeId }

    const { status, body } = await request(app({ database }))
      .post(`/teams/${team.id}/solves`)
      .set({ Authorization: token })
      .set('content-type', 'application/json')
      .send(data)

    const firstError: APIError = body.errors[0]
    expect(status).toBe(422)
    expect(firstError.param).toBe('proof')
  })

  it('Should not accept submission to another team', async () => {
    const database = prepareDatabase(store)

    const challenge = await database.challenges.get(challengeId)
    const proof = await claimFlag(team.name, 'CTF-BR{123}', challenge)

    const data = {
      proof,
      challengeId
    }

    const { status, body } = await request(app({ database }))
      .post(`/teams/${team2.id}/solves`)
      .set({ Authorization: token })
      .set('content-type', 'application/json')
      .send(data)

    const firstError: APIError = body.errors[0]

    expect(status).toBe(403)
    expect(firstError.code).toBe('authorization')
    expect(firstError.message).toBe("you don't belong on this team")
  })

  it('Should not accept flag from another team', async () => {
    const database = prepareDatabase(store)

    const challenge = await database.challenges.get(challengeId)
    const proof = await claimFlag(team2.name, 'CTF-BR{123}', challenge)

    const data = {
      proof,
      challengeId
    }

    const { status, body } = await request(app({ database }))
      .post(`/teams/${team.id}/solves`)
      .set({ Authorization: token })
      .set('content-type', 'application/json')
      .send(data)

    const firstError: APIError = body.errors[0]

    expect(status).toBe(422)
    expect(firstError.code).toBe('semantic')
    expect(firstError.message).toBe('Invalid proof')
  })

  it('Should not accept submission to already solved challenge ', async () => {
    const database = prepareDatabase(store)

    const challenge = await database.challenges.get(challengeId)
    const proof = await claimFlag(team.name, 'CTF-BR{123}', challenge)

    const data = {
      proof,
      challengeId
    }

    database.solves.register(team.id, challengeId)

    const { status, body } = await request(app({ database }))
      .post(`/teams/${team.id}/solves`)
      .set({ Authorization: token })
      .set('content-type', 'application/json')
      .send(data)

    const firstError: APIError = body.errors[0]

    expect(status).toBe(422)
    expect(firstError.code).toBe('semantic')
    expect(firstError.message).toBe('Your team already solved this challenge')
  })

  it('Should not accept invalid proof', async () => {
    const database = prepareDatabase(store)

    const proof = Buffer.from('123', 'ascii').toString('base64')

    const data = {
      proof,
      challengeId
    }

    const { status, body } = await request(app({ database }))
      .post(`/teams/${team.id}/solves`)
      .set({ Authorization: token })
      .set('content-type', 'application/json')
      .send(data)

    const firstError: APIError = body.errors[0]

    expect(status).toBe(422)
    expect(firstError).not.toEqual(undefined)
    expect(firstError.code).toBe('semantic')
    expect(firstError.message).toBe('Invalid proof')
  })
})
