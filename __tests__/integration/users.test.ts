import request from 'supertest'
import app from '../../src/app'
import { prepareDatabase, DatabaseStructure, APIError } from '../../utils'

const store: DatabaseStructure = {
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
    const { body, status } = await request(app({ database }))
      .post('/users')
      .send(data)

    const uuid: string = body.uuid
    const email: string = body.email
    const displayName: string = body.displayName

    expect(uuid.length).toBeGreaterThan(0)
    expect(email).toEqual(data.email)
    expect(displayName).toEqual(data.displayName)

    expect(status).toBe(201)
  })

  it('Should not create a already exists user account', async () => {
    const database = prepareDatabase(store)

    const data = {
      email: 'nizkctf@mailinator.com',
      displayName: 'User tester',
      password: '123456'
    }

    await database.users.register(data)

    const { body, status } = await request(app({ database }))
      .post('/users')
      .send(data)

    const firstError: APIError = body.errors[0]

    expect(status).toBe(422)
    expect(firstError.code).toEqual('semantic')
    expect(firstError.message).toEqual('Already exists a user with this email')
  })

  it('Should not create a user account without email', async () => {
    const database = prepareDatabase(store)

    const data = {
      email: 'nizkctf',
      displayName: 'User tester',
      password: '123456'
    }

    const { body, status } = await request(app({ database }))
      .post('/users')
      .send(data)

    const firstError: APIError = body.errors[0]

    expect(firstError.param).toEqual('email')
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

    const { body, status } = await request(app({ database }))
      .post('/users/login')
      .send(data)

    const user: { uuid: string; email: string; displayName: string } = body.user
    const token: string = body.token
    const refreshToken: string = body.refreshToken
    const { uuid, email, displayName } = user

    expect(uuid.length).toBeGreaterThan(0)
    expect(email).toEqual(data.email)
    expect(displayName).toEqual(data.displayName)
    expect(token.length).toBeGreaterThan(0)
    expect(refreshToken.length).toBeGreaterThan(0)

    expect(status).toBe(200)
  })

  it('Should not login without email', async () => {
    const database = prepareDatabase(store)

    const data = {
      email: 'nizkctf@mailinator.com',
      displayName: 'User tester',
      password: '123456'
    }

    await database.users.register(data)

    const { body, status } = await request(app({ database }))
      .post('/users/login')
      .send({ ...data, email: undefined })

    const firstError: APIError = body.errors[0]

    expect(firstError.param).toEqual('email')
    expect(status).toBe(422)
  })

  it('Should not login without password', async () => {
    const database = prepareDatabase(store)

    const data = {
      email: 'nizkctf@mailinator.com',
      displayName: 'User tester',
      password: '123456'
    }

    await database.users.register(data)

    const { body, status } = await request(app({ database }))
      .post('/users/login')
      .send({ ...data, password: undefined })

    const firstError: APIError = body.errors[0]

    expect(firstError.param).toEqual('password')
    expect(status).toBe(422)
  })

  it('Should not login without exists user', async () => {
    const database = prepareDatabase(store)

    const data = {
      email: 'nizkctf@mailinator.com',
      displayName: 'User tester',
      password: '123456'
    }

    const { body, status } = await request(app({ database }))
      .post('/users/login')
      .send(data)

    const firstError: APIError = body.errors[0]

    expect(status).toBe(404)
    expect(firstError.code).toBe('not-found')
    expect(firstError.message).toBe('Not exists a user with this email')
  })

  it('Should not login with invalid password', async () => {
    const database = prepareDatabase(store)

    const data = {
      email: 'nizkctf@mailinator.com',
      displayName: 'User tester',
      password: '123456'
    }

    await database.users.register(data)

    const { body, status } = await request(app({ database }))
      .post('/users/login')
      .send({ ...data, password: '654321' })

    const firstError: APIError = body.errors[0]

    expect(status).toBe(422)
    expect(firstError.code).toBe('semantic')
    expect(firstError.message).toBe('Wrong password')
  })
})
