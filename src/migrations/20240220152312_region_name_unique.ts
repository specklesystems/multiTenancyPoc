import type { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  await knex.schema.alterTable('regions', (table) => {
    table.unique('name')
  })
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.alterTable('regions', (table) => {
    table.dropUnique(['name'])
  })
}
