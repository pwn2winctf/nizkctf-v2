import express, { Express } from 'express'
import compression from 'compression'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'

import routes from './routes'
import errorHandler from './middlewares/error.middleware'
import { APP_ENV } from './config'

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
    current: (
      uid: string
    ) => Promise<{ uid: string; team?: Omit<Team, 'members'> }>
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

export interface AppInterface {
  port?: number
  database: Database
}

export default function App (args: AppInterface): Express {
  const { port, database } = args

  const app = express()
  app.use(express.json())
  app.use(compression())
  app.use(helmet())
  app.use(cors())
  app.use(morgan('combined', { skip: () => APP_ENV === 'test' }))

  app.use('/', routes(database))

  app.listen(port, () => null)

  return errorHandler(app)
}
