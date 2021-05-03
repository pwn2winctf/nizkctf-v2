import express, { Express } from 'express'
import compression from 'compression'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'
import * as Sentry from '@sentry/node'
import * as Tracing from '@sentry/tracing'

import routes from './routes'
import errorHandler from './middlewares/error.middleware'
import { APP_ENV, SENTRY_DSN } from './config'

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
    register: ({ uid, shareInfo }: { uid: string, shareInfo: boolean }) => Promise<void>
  }
  solves: {
    all: () => Promise<{ [teamId: string]: Solves }>
    allWithFlag: () => Promise<Array<{ teamId: string, challengeId: string, flag: string, moment: number }>>
    get: (teamId: string) => Promise<Solves>
    register: (teamId: string, challengeId: string, flag: string) => Promise<Solves>
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

  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Integrations.Express({ app })
    ],
    environment: APP_ENV,
    debug: APP_ENV !== 'production',
    tracesSampleRate: 1.0
  })

  app.use(Sentry.Handlers.requestHandler())
  app.use(Sentry.Handlers.tracingHandler())

  app.use('/', routes(database))

  app.listen(port, () => null)

  app.use(Sentry.Handlers.errorHandler())
  return errorHandler(app)
}
