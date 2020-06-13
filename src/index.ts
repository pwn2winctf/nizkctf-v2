import app from './app'
import firebaseInstance from './firebase'

const database = firebaseInstance

const run = async () => {
  app({ port: parseInt(process.env.PORT) || 8080, database })
}

run()
