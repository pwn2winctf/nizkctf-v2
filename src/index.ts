import { Redis } from 'ioredis'

import app from './app'
import { PORT, REDIS_PASSWORD, REDIS_HOST, REDIS_PORT } from './config'
import database from './databases/relational'

async function run () {
  const redis = new Redis({
    host: REDIS_HOST,
    port: parseInt(REDIS_PORT),
    password: REDIS_PASSWORD
  })
  app({ port: PORT ? parseInt(PORT) : 8080, database, redis })
}

run()
