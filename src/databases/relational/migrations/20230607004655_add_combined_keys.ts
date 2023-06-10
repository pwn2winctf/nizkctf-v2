import { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  return knex.schema.alterTable('challenges', table => {
    table.text('hashedKey').notNullable()
    table.text('combinedKey').notNullable()
    table.text('serverPublicKey').notNullable()
    table.text('serverPrivateKey').notNullable()
  })
    .alterTable('solves', table => {
      table.renameColumn('flag', 'proof')
    })
}

export async function down (knex: Knex): Promise<void> {
  return knex.schema.alterTable('challenges', table => {
    table.dropColumn('hashedKey')
    table.dropColumn('combinedKey')
    table.dropColumn('serverPublicKey')
    table.dropColumn('serverPrivateKey')
  })
    .alterTable('solves', table => {
      table.renameColumn('proof', 'flag')
    })
}
