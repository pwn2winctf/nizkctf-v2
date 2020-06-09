import request from 'supertest'

import { prepareDatabase, DatabaseStructure } from '../../utils'
import app from '../../src/app'
import { createTeamKeys, TeamKeys } from '../../src/libsodium'

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

let keys:TeamKeys = { cryptPk: '', cryptSk: '', signPk: '', signSk: '' }

describe('Teams endpoints', () => {
  beforeAll(async () => {
    keys = await createTeamKeys()
  })

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
      countries: [],
      signPk: keys.signPk,
      cryptPk: keys.cryptPk
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
      countries: ['br', 'us', 'jp', 'zw', 'pt'],
      signPk: keys.signPk,
      cryptPk: keys.cryptPk
    }
    const response = await request(app({ database }))
      .post('/teams')
      .set({ Authorization: token })
      .send(data)

    expect(response.status).toBe(201)
  })

  it('Should not create team without name', async () => {
    const database = prepareDatabase(store)

    const data = {
      name: '',
      countries: [],
      signPk: keys.signPk,
      cryptPk: keys.cryptPk
    }

    const response = await request(app({ database }))
      .post('/teams')
      .set({ Authorization: token })
      .send(data)
    expect(response.status).toBe(422)
  })

  it('Should not create team without valid countries flag', async () => {
    const database = prepareDatabase(store)

    const data = {
      name: '',
      countries: ['usa'],
      signPk: keys.signPk,
      cryptPk: keys.cryptPk
    }

    const response = await request(app({ database }))
      .post('/teams')
      .set({ Authorization: token })
      .send(data)
    expect(response.status).toBe(422)
  })

  it('Should not create team with more countries flag than allowed', async () => {
    const database = prepareDatabase(store)

    const data = {
      name: '',
      countries: ['br', 'us', 'jp', 'zw', 'pt', 'ru'],
      signPk: keys.signPk,
      cryptPk: keys.cryptPk
    }

    const response = await request(app({ database }))
      .post('/teams')
      .set({ Authorization: token })
      .send(data)

    expect(response.status).toBe(422)
  })

  it('Should not create team without cryptPk', async () => {
    const database = prepareDatabase(store)

    const data = {
      name: 'Team test',
      countries: [],
      signPk: keys.signPk
    }
    const response = await request(app({ database }))
      .post('/teams')
      .set({ Authorization: token })
      .send(data)

    expect(response.status).toBe(422)
  })

  it('Should not create team without signPk', async () => {
    const database = prepareDatabase(store)

    const data = {
      name: 'Team test',
      countries: [],
      cryptPk: keys.cryptPk
    }
    const response = await request(app({ database }))
      .post('/teams')
      .set({ Authorization: token })
      .send(data)

    expect(response.status).toBe(422)
  })
})
