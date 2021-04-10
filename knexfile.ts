// Update with your config settings.
import path from 'path'
import { DATABASE_URL } from './src/config'

const stages = {

  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3'
    },
    useNullAsDefault: true,
    migrations: {
      tableName: 'knex_migrations',
      directory: path.resolve(__dirname, 'src', 'databases', 'relational', 'migrations'),
      loadExtensions: ['.ts']
    },
    seeds: {
      directory: path.resolve(__dirname, 'src', 'databases', 'relational', 'seeds'),
      loadExtensions: ['.ts']
    }
  },
  production: {
    client: 'postgresql',
    connection: DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: path.resolve(__dirname, 'src', 'databases', 'relational', 'migrations'),
      loadExtensions: ['.ts']
    },
    seeds: {
      directory: path.resolve(__dirname, 'src', 'databases', 'relational', 'seeds'),
      loadExtensions: ['.ts']
    }
  }

}

export default stages
