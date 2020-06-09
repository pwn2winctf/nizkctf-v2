import request from 'supertest'
import app from '../../src/app'
import { prepareDatabase, DatabaseStructure } from '../../utils'

const store:DatabaseStructure = {
  teams: {},
  users: {},
  solves: {},
  challenges: {}
}

describe('Users endpoints', () => {
  beforeEach(async () => {
    store.users = {}
    store.teams = {}
  })

  it('Should create a user account', async () => {
    const database = prepareDatabase(store)

    const data = {
      email: 'nizkctf@mailinator.com',
      displayName: 'User tester',
      password: '123456'
    }
    const { body, status } = await request(app({ database })).post('/users').send(data)

    const uuid: string = body.uuid
    const email: string = body.email
    const displayName: string = body.displayName

    expect(uuid.length).toBeGreaterThan(0)
    expect(email).toEqual(data.email)
    expect(displayName).toEqual(data.displayName)

    expect(status).toBe(201)
  })

  it('Should not create a user account without email', async () => {
    const database = prepareDatabase(store)

    const data = {
      email: 'nizkctf',
      displayName: 'User tester',
      password: '123456'
    }

    const { body, status } = await request(app({ database })).post('/users').send(data)

    const firstError:string = body.errors[0].param

    expect(firstError).toEqual('email')
    expect(status).toBe(422)
  })

  it('Should login', async () => {
    const database = prepareDatabase(store)

    const data = {
      email: 'nizkctf@mailinator.com',
      displayName: 'User tester',
      password: '123456'
    }

    await database.users.register(data)

    const { body, status } = await request(app({ database })).post('/users/login').send(data)

    const user: { uuid: string, email: string, displayName: string } = body.user
    const token:string = body.token
    const refreshToken:string = body.refreshToken
    const { uuid, email, displayName } = user

    expect(uuid.length).toBeGreaterThan(0)
    expect(email).toEqual(data.email)
    expect(displayName).toEqual(data.displayName)
    expect(token.length).toBeGreaterThan(0)
    expect(refreshToken.length).toBeGreaterThan(0)

    expect(status).toBe(200)
  })
})
