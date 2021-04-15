import { Database, Team as ITeam, Challenge } from '../../app'
// import { createSHA256, getUserDataFromJWT } from '../utils'
// import { NotFoundError, SemanticError } from '../types/errors.type'
import knex from 'knex'
import knexfile from '../../../knexfile'
import { NotFoundError, SemanticError } from '../../types/errors.type'
import { Countries, Team, User } from 'knex/types/tables'
import { createSHA256 } from '../../utils'

declare module 'knex/types/tables' {
  interface Team {
    id: string,
    name: string
  }
  interface User {
    id: string,
    shareInfo: boolean,
    teamId?: Team['id'],
  }
  interface Countries {
    id: number,
    name: string
  }
  interface TeamCountries {
    id: number,
    teamId: Team['id'],
    countryId: Countries['id']
  }
  interface Challenge {
    id: string,
    name: string,
    pk: string,
    salt: string,
    opslimit: number,
    memlimit: number
  }
  interface Solve {
    challengeId: Challenge['id'],
    teamId: Team['id'],
    moment: number
  }

  interface Tables {
    users: User
    teams: Team
    countries: Countries
    teamCountries: TeamCountries
    challenges: Challenge,
    solves: Solve
  }
}

const db = knex(knexfile.development)

const teams: Database['teams'] = {
  register: async ({ name, countries, members }): Promise<ITeam> => {
    const id = createSHA256(name)
    try {
      await db.transaction(async transaction => {
        await transaction.insert({ id, name }).into('teams')

        if (countries.length > 0) {
          const countriesId = await transaction.select('*').from('countries').whereIn('name', countries)
          if (countriesId.length === 0) {
            throw new SemanticError('Invalid country')
          }
          await transaction.insert(countriesId.map(country => ({ teamId: id, countryId: country.id }))).into('teamCountries')
        }

        await transaction.insert({ id: members[0], teamId: id }).into('users')
      })

      return { id, name, countries, members }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('UNIQUE constraint failed: users.id')) {
          throw new SemanticError('you are already member of a team')
        } else if (err.message.includes('UNIQUE constraint failed: teams.name')) {
          throw new SemanticError('Already exists this team')
        } else if (err.message === 'Invalid Country') {
          throw new SemanticError(err.message)
        } else {
          throw new SemanticError('Invalid country')
        }
      } else {
        throw new Error(err)
      }
    }
  },
  get: async (id: string): Promise<ITeam> => {
    const teamData = await db.select('teams.name').from('teams').where({ id }).first()
    if (!teamData) {
      throw new NotFoundError('Not found')
    }

    const members = (await db.select('id').from('users').where('teamId', '=', id)).map(row => row.id)

    const countries = (await db.select('name').from('teamCountries').where('teamId', '=', id).innerJoin('countries', 'teamCountries.countryId', 'countries.id')).map(row => row.name)

    const team = {
      id,
      name: teamData.name,
      members: members ?? [],
      countries: countries ?? []
    }

    return team
  },
  list: async (): Promise<ITeam[]> => {
    const queryTeamsLeftJoinUsers = db.select({
      id: 'teams.id',
      name: 'teams.name',
      user: 'users.id'
    }).from('teams').leftJoin('users', 'teams.id', 'users.teamId')
    const queryTeamsInnerJoinCountries = db.select({
      id: 'teams.id',
      country: 'countries.name'
    }).from('teams').leftJoin('teamCountries', 'teams.id', 'teamCountries.teamId').innerJoin('countries', 'teamCountries.countryId', 'countries.id')

    const [teamsLeftJoinUsers, teamsInnerJoinCountries]: [Array<{ id: Team['id'], name: Team['name'], user?: User['id'] }>, Array<{ id: Team['id'], country: Countries['name'] }>] = await Promise.all([queryTeamsLeftJoinUsers, queryTeamsInnerJoinCountries])

    const data = teamsLeftJoinUsers.reduce((obj: { [teamId: string]: ITeam }, team) => {
      const { id, name, user } = team
      if (obj[id]) {
        if (user) {
          obj[id].members.push(user)
        }
      } else {
        obj[id] = {
          id,
          name,
          members: user ? [user] : [],
          countries: []
        }
      }
      return obj
    }, {})

    teamsInnerJoinCountries.forEach(teamCountry => {
      data[teamCountry.id].countries.push(teamCountry.country)
    })

    return Object.values(data)
  }

}

const users: Database['users'] = {
  current: async (id: string) => {
    const rows = await db.select<{ name: Team['name'], country: Countries['name'], id: Team['id'] }[]>({
      name: 'teams.name',
      country: 'countries.name',
      id: 'teams.id'
    }).from('users').where('users.id', '=', id)
      .innerJoin('teams', 'users.teamId', 'teams.id')
      .leftJoin('teamCountries', 'teams.id', 'teamCountries.teamId')
      .leftJoin('countries', 'teamCountries.countryId', 'countries.id')

    if (rows.length === 0) {
      return {
        uid: id
      }
    }

    const data = {
      uid: id,
      team: {
        name: rows[0].name,
        id: rows[0].id,
        countries: rows.map(row => row.country)
      }
    }
    return data
  }
}

const challenges: Database['challenges'] = {
  all: async () => {
    const challenges = await db.select('*').from('challenges')

    return challenges.reduce((obj: { [challengeId: string]: Challenge }, challenge) => {
      obj[challenge.id] = challenge
      return obj
    }, {})
  },
  get: async (id: string) => {
    const challenge = await db.select('*').from('challenges').where({ id }).first()

    if (!challenge) {
      throw new NotFoundError('Not found')
    }

    return challenge
  }
}

const solves: Database['solves'] = {
  all: async () => {
    const solves = await db.select('*').from('solves')

    return solves.reduce((obj: { [teamId: string]: { [key: string]: number } }, item) => {
      if (obj[item.teamId]) {
        obj[item.teamId][item.challengeId] = item.moment
      } else {
        obj[item.teamId] = { [item.challengeId]: item.moment }
      }

      return obj
    }, {})
  },
  register: async (teamId, challengeId) => {
    try {
      const timestamp = new Date().getTime()
      await db.insert({ teamId, challengeId, moment: timestamp }).into('solves')
      return { challengeId: timestamp }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('UNIQUE constraint failed: solves.challengeId, solves.teamId')) {
          throw new SemanticError('Your team already solved this challenge')
        } else {
          throw new Error(err.message)
        }
      } else {
        throw new Error(err)
      }
    }
  },
  get: async (id: string) => {
    const solves = await db.select('*').from('solves').where({ teamId: id })
    return solves.reduce((obj: { [challengeId: string]: number }, { challengeId, moment }) => {
      obj[challengeId] = moment
      return obj
    }, {})
  }
}

const database: Database = {
  teams,
  users,
  challenges,
  solves
}

export default database
