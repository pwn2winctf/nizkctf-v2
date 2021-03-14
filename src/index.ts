import app from './app'
import { FIREBASE_CREDENTIALS, DATABASE_URL, PORT } from './config'
import { init as initFirebaseDabase } from './databases/firebase'

const databaseCredentials = FIREBASE_CREDENTIALS
const databaseURL = DATABASE_URL

async function run () {
  const database = await initFirebaseDabase({ credential: databaseCredentials, databaseURL })
  app({ port: PORT ? parseInt(PORT) : 8080, database })
}

run()
