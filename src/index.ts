import app from './app'
import { DATABASE_CREDENTIALS, DATABASE_URL, PORT } from './config'
import { init as initDabase } from './firebase'

const databaseCredentials = DATABASE_CREDENTIALS
const databaseURL = DATABASE_URL

async function run () {
  const database = initDabase({ credential: databaseCredentials, databaseURL })
  app({ port: PORT ? parseInt(PORT) : 8080, database })
}

run()
