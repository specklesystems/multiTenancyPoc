import type { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  await knex.schema.alterTable('regions', (table) => {
    table.text('sslCaCert').nullable()
  })
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.alterTable('regions', (table) => {
    table.dropColumn('sslCaCert')
  })
}
