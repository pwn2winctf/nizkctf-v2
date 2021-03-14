import express, { Express } from 'express'
import compression from 'compression'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'

import routes from './routes'
import errorHandler from './middlewares/error.middleware'

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

export interface Solves {
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
    list: () => Promise<Array<Omit<Team, 'members'>>>
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
    ) => Promise<{ uuid: string; email: string; displayName: string, team?: Omit<Team, 'members'> }>
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
    all: () => Promise<{ [teamId: string]: Solves }>
    get: (teamId: string) => Promise<Solves>
    register: (teamId: string, challengeId: string) => Promise<Solves>
  }
  challenges: {
    all: () => Promise<{ [challengeId: string]: Challenge }>
    get: (id: string) => Promise<Challenge>
  }
}

export default function App (args: AppInterface): Express {
  const { port, database } = args

  const app = express()
  app.use(express.json())
  app.use(compression())
  app.use(helmet())
  app.use(cors())
  app.use(morgan('combined', { skip: (req, res) => process.env.NODE_ENV === 'test' }))

  app.use('/', routes(database))

  app.listen(port, () => null)

  return errorHandler(app)
}
