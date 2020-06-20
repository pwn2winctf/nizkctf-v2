import request from 'supertest'

import { prepareDatabase, DatabaseStructure, claimFlag, APIError } from '../../utils'
import app from '../../src/app'

const store: DatabaseStructure = {
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

const user = {
  uuid: '',
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

describe('Teams solves', () => {
  beforeEach(async () => {
    store.users = {}
    store.teams = {}
    store.solves = {}

    const database = prepareDatabase(store)

    const { uuid } = await database.users.register(user)
    const data = await database.users.login(user)
    token = data.token
    user.uuid = uuid

    team = await database.teams.register({ ...team, members: [user.uuid] })
    team = { ...team }
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

    expect(status).toBe(400)
    expect(firstError.code).toBe('semantic')
    expect(firstError.message).toBe('Invalid proof')
  })
})
