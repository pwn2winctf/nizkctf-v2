import request from 'supertest'

import { prepareDatabase, DatabaseStructure, APIError } from '../../utils'
import app from '../../src/app'

const store: DatabaseStructure = {
  teams: {},
  users: {},
  solves: {},
  challenges: {}
}

const user = {
  email: 'lorhan@mailinator.com',
  displayName: 'Lorhan Sohaky',
  password: '123456'
}

let token = ''

describe('Teams endpoints', () => {
  beforeEach(async () => {
    store.users = {}
    store.teams = {}

    const database = prepareDatabase(store)

    await database.users.register(user)
    const data = await database.users.login(user)
    token = data.token
  })

  it('Should create team without any country flag', async () => {
    const database = prepareDatabase(store)

    const data = {
      name: 'Team test',
      countries: []
    }
    const response = await request(app({ database }))
      .post('/teams')
      .set({ Authorization: token })
      .send(data)

    expect(response.status).toBe(201)
  })

  it('Should create team', async () => {
    const database = prepareDatabase(store)

    const data = {
      name: 'Team test',
      countries: ['br', 'us', 'jp', 'zw', 'pt']
    }
    const response = await request(app({ database }))
      .post('/teams')
      .set({ Authorization: token })
      .send(data)

    expect(response.status).toBe(201)
  })

  it('Should not create team without token', async () => {
    const database = prepareDatabase(store)

    const data = {
      name: 'Team test',
      countries: ['br', 'us', 'jp', 'zw', 'pt']
    }
    const response = await request(app({ database }))
      .post('/teams')
      .send(data)

    const firstError: APIError = response.body.errors[0]
    expect(response.status).toBe(403)
    expect(firstError.code).toBe('Authorization')
    expect(firstError.message).toBe('No credentials sent!')
  })

  it('Should not create team without name', async () => {
    const database = prepareDatabase(store)

    const data = {
      name: '',
      countries: []
    }

    const { body, status } = await request(app({ database }))
      .post('/teams')
      .set({ Authorization: token })
      .send(data)

    const firstError: APIError = body.errors[0]

    expect(status).toBe(422)
    expect(firstError.param).toBe('name')
  })

  it('Should not create team without valid countries flag', async () => {
    const database = prepareDatabase(store)

    const data = {
      name: '',
      countries: ['usa']
    }

    const { body, status } = await request(app({ database }))
      .post('/teams')
      .set({ Authorization: token })
      .send(data)

    const firstError: APIError = body.errors[0]

    expect(status).toBe(422)
    expect(firstError.param).toBe('name')
  })

  it('Should not create team with more countries flag than allowed', async () => {
    const database = prepareDatabase(store)

    const data = {
      name: 'Testing',
      countries: ['br', 'us', 'jp', 'zw', 'pt', 'ru']
    }

    const { body, status } = await request(app({ database }))
      .post('/teams')
      .set({ Authorization: token })
      .send(data)

    const firstError: APIError = body.errors[0]

    expect(status).toBe(422)
    expect(firstError.param).toBe('countries')
  })
})
