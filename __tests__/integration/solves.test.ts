import request from 'supertest'

import { prepareDatabase, DatabaseStructure, claimFlag } from '../../utils'
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

    const response = await request(app({ database }))
      .post(`/teams/${team.id}/solves`)
      .set({ Authorization: token })
      .set('content-type', 'application/json')
      .send(data)

    expect(response.status).toBe(200)
  })
})
