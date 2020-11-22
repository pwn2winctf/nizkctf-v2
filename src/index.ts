import dotEnvFlow from 'dotenv-flow'

import app from './app'
import { init as initDabase } from './firebase'

dotEnvFlow.config()

const databaseCredentials = JSON.parse(process.env.CREDS || '')
const databaseURL = process.env.DATABASE_URL || ''

async function run () {
  const database = initDabase({ credential: databaseCredentials, databaseURL })
  app({ port: process.env.PORT ? parseInt(process.env.PORT) : 8080, database })
}

run()
