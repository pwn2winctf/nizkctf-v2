import { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  return knex.schema.alterTable('teamCountries', table => {
    table.dropForeign('countryId')
    table.dropForeign('teamId')

    table.foreign('teamId').references('id').inTable('teams').onDelete('NO ACTION')
    table.foreign('countryId').references('id').inTable('countries').onDelete('NO ACTION')
  })
    .alterTable('solves', table => {
      table.dropForeign('challengeId')
      table.dropForeign('teamId')

      table.foreign('challengeId').references('id').inTable('challenges').onDelete('NO ACTION')
      table.foreign('teamId').references('id').inTable('teams').onDelete('NO ACTION')
    })
}

export async function down (knex: Knex): Promise<void> {
  return knex.schema.alterTable('teamCountries', table => {
    table.dropForeign('countryId')
    table.dropForeign('teamId')

    table.foreign('teamId').references('id').inTable('teams').onDelete('CASCADE')
    table.foreign('countryId').references('id').inTable('countries').onDelete('CASCADE')
  })
    .alterTable('solves', table => {
      table.dropForeign('challengeId')
      table.dropForeign('teamId')

      table.foreign('challengeId').references('id').inTable('challenges').onDelete('CASCADE')
      table.foreign('teamId').references('id').inTable('teams').onDelete('CASCADE')
    })
}
