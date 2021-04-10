import app from './app'
import { PORT } from './config'
import database from './databases/relational'

async function run () {
  app({ port: PORT ? parseInt(PORT) : 8080, database })
}

run()
