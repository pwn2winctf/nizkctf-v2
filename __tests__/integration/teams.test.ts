import request from 'supertest'

import { prepareDatabase, DatabaseStructure, APIError, createJWTToken } from '../../utils'
import app from '../../src/app'
import { getUserDataFromJWT } from '../../src/utils'

const store: DatabaseStructure = {
  teams: {},
  users: {},
  solves: {},
  challenges: {}
}

const user = {
  uid: '',
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
    user.uid = data.user.uid
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

  it('Should not create team with a invalid token', async () => {
    const database = prepareDatabase(store)

    const data = {
      name: 'Team test',
      countries: ['br', 'us', 'jp', 'zw', 'pt']
    }

    const { uid, email, displayName } = await getUserDataFromJWT(token)

    const wrongPrivateKey = '-----BEGIN RSA PRIVATE KEY-----\nMIICXAIBAAKBgQC+uQGmgtlFkJ330HiV7p8aRv0gvL22i0H683/udK9BVNXbNad7\nYKuepUUFldF9nWmcNncEz/Mhe6B+rGeyYLLY67QPEJjHDpoTbGNqnKdZRI+sLKdl\nbdNWM73RzhSYRNil8h7EuKzCbWF8D61faUZtXX/t7xYsVql0iOy3OpYuWQIDAQAB\nAoGBAL2carKjVeTeMN6FyMyurkjOmKtqWWXZLuCSIvbr1Kyr7e0Ae6CibBzODD/Q\nQbSTwcJHN652Gy6HnPky5+kkT8i3pWKeq336l24lsLy3xlNUjbOFi/ixu2/+LH4X\nE8WA6K6KRgw41rG46/3gTL9F0grak08KVBI4fJwfxxQLuAPtAkEA4RtFd9EAt5qb\nhfuSSp/2R6o2rXzCNzFNAti/iTfiL1tBREFvMt1bVGpWrmzAAiRYTV21NKIb9GQ3\nygi0ncNSKwJBANjlt9NGuJ9/9mWMLv6DC+xw8AE+vOMjpFs2kUtXfjyxjdwytBSn\nE4T2KR2FMeKSeqq7JLQDXhxkaIapHyV+M4sCQBw04puE4OYgxWQghdA8Awwv0/Ih\nM+TelJvKtRVonzr34FHBMUHaYttNB9eLYPPjwfzPxSj3NzGEbUkvlhI+q0kCQH2Q\nX18cbf1IYyheg0YsL1bt+sN9wnPsSlXTvUFUoWwZjfqQD9h08MPkjeDdHwf/rKvy\nM0lTOcRODIUIm1NlQAkCQEvzLUARO5tKUHwt87kUISugtKo2+HDe+5DSjUW0m4Ih\nlo1uYRoOjqR0QZSv2wqFnH7fiJzYsvpQicIm+ZwOQg0=\n-----END RSA PRIVATE KEY-----'

    const invalidToken = createJWTToken({ userId: uid, email, displayName: displayName, verified: true }, wrongPrivateKey)

    const { body, status } = await request(app({ database }))
      .post('/teams')
      .set({ Authorization: invalidToken })
      .send(data)

    expect(status).toBe(403)
    const firstError: APIError = body.errors[0]
    expect(firstError.code).toBe('authorization')
    expect(firstError.message).toBe('Invalid token')
  })

  it('Should not create already exists team', async () => {
    const database = prepareDatabase(store)

    const data = {
      name: 'Team test',
      countries: ['br', 'us', 'jp', 'zw', 'pt']
    }
    database.teams.register({ ...data, members: [user.uid] })

    const { body, status } = await request(app({ database }))
      .post('/teams')
      .set({ Authorization: token })
      .send(data)

    const firstError: APIError = body.errors[0]

    expect(status).toBe(422)
    expect(firstError).not.toEqual(undefined)
    expect(firstError.code).toBe('semantic')
    expect(firstError.message).toBe('This team already exists')
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
    expect(response.status).toBe(401)
    expect(firstError.code).toBe('authorization')
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
