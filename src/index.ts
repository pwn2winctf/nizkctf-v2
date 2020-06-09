import app from './app'
import firebaseInstance from './firebase'

const database = firebaseInstance

const run = async () => {
  app({ database, port: 3000 })
  app({ port: 8080, database })
}

run()
