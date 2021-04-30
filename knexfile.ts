// Update with your config settings.
import path from 'path'
import { DATABASE_PASSWORD, DATABASE_HOST, DATABASE_USER, APP_ENV } from './src/config'

const dbSocketPath = process.env.DB_SOCKET_PATH || '/cloudsql'
const host = APP_ENV === 'production' ? `${dbSocketPath}/${DATABASE_HOST}` : DATABASE_HOST

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
  test: {
    client: 'sqlite3',
    connection: {
      filename: './test.sqlite3'
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
    connection: {
      user: DATABASE_USER,
      password: DATABASE_PASSWORD,
      host: host
    },
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
