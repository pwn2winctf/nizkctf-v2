import { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  return knex.schema.createTable('teams', table => {
    table.text('id').primary()
    table.text('name').unique().notNullable()
  })
    .createTable('countries', table => {
      table.increments('id')
      table.text('name').unique().notNullable()
    })
    .createTable('teamCountries', table => {
      table.increments('id')
      table.text('teamId').references('teams.id').notNullable().onDelete('CASCADE')
      table.text('countryId').references('countries.id').notNullable().onDelete('CASCADE')
    })
    .createTable('users', table => {
      table.text('id').primary()
      table.text('teamId').references('teams.id').nullable().onDelete('SET NULL')
    })
    .createTable('challenges', table => {
      table.text('id').primary()
      table.text('name').notNullable()
      table.text('pk').notNullable()
      table.text('salt').notNullable()
      table.integer('opslimit').notNullable()
      table.integer('memlimit').notNullable()
    })
    .createTable('solves', table => {
      table.text('challengeId').notNullable().references('id').inTable('challenges').onDelete('CASCADE')
      table.text('teamId').notNullable().references('id').inTable('teams').onDelete('CASCADE')
      table.timestamp('moment').notNullable()

      table.unique(['challengeId', 'teamId'])
    })
}

export async function down (knex: Knex): Promise<void> {
  return knex.schema.dropTable('solves').dropTable('challenges').dropTable('users').dropTable('teamCountries').dropTable('teams').dropTable('countries')
}
