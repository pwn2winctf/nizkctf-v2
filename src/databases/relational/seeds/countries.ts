import { Knex } from 'knex'

import { countries } from '../../../../constants.json'

export async function seed (knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('countries').del()

  // Inserts seed entries
  await knex('countries').insert(countries.map(item => ({ name: item })))
}
