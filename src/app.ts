import express from 'express'
import routes from './routes'
import { Server } from 'http'
import { AddressInfo } from 'net'

export interface AppInterface {
  port?: number
  database: Database
}

export interface Team {
  id: string
  name: string
  countries: string[]
  members: string[]
}

export interface Solve {
  [key: string]: number
}

export interface Challenge {
  id: string
  name: string
  pk: string
  salt: string
  opslimit: number
  memlimit: number
}

export interface Database {
  teams: {
    register: (team: Omit<Team, 'id'>) => Promise<Team>
    get: (id: string) => Promise<Team>
  }
  users: {
    register: ({
      email,
      password,
      displayName
    }: {
      email: string
      password: string
      displayName: string
    }) => Promise<{ uuid: string; email: string; displayName: string }>
    get: (id: string) => Promise<{ id: string }>
    current: (
      token: string
    ) => Promise<{ uuid: string; email: string; displayName: string }>
    login: ({
      email,
      password
    }: {
      email: string
      password: string
    }) => Promise<{
      user: { uuid: string; email: string; displayName: string }
      token: string
      refreshToken: string
    }>
  }
  solves: {
    get: (teamId: string) => Promise<Solve>
    register: (teamId: string, challengeId: string) => Promise<Solve>
  }
  challenges: {
    get: (id: string) => Promise<Challenge>
  }
}

export default function App (args: AppInterface): Server {
  const { port, database } = args

  const app = express()
  app.use(express.json())

  app.use('/', routes(database))

  const listener = app.listen(port, function () {
    const { port } = listener.address() as AddressInfo

    if (process.env.NODE_ENV !== 'test') {
      console.log(`Listening on port ${port}!`)
    }
  })

  return listener
}
