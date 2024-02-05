import type { Knex } from 'knex'

const tableName = 'users'

export async function up (knex: Knex): Promise<void> {
  return await knex.schema.alterTable(tableName, (table) => {
    table.text('name').notNullable().alter()
  })
}

export async function down (knex: Knex): Promise<void> {
  return await knex.schema.alterTable(tableName, (table) => {
    table.text('name').nullable().alter()
  })
}
