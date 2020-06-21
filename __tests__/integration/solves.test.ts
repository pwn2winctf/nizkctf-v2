import request from 'supertest'

import { prepareDatabase, DatabaseStructure, claimFlag, APIError } from '../../utils'
import app from '../../src/app'

const initialState: DatabaseStructure = {
  teams: {

  },
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

    const { uuid } = await database.users.register(user)
    const data = await database.users.login(user)
    token = data.token
    user.uuid = uuid

    team = await database.teams.register({ ...team, members: [user.uuid] })
    team2 = await database.teams.register({ ...team2, members: ['random_uuid'] })
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
    expect(firstError.message).toBe('you don\'t belong on this team')
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
