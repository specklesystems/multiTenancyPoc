import type { Knex } from 'knex'

const regionsTableName = 'regions'

export async function up (knex: Knex): Promise<void> {
  await knex.schema.alterTable(regionsTableName, (table) => {
    table.text('name').notNullable().defaultTo('region')
  })
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.alterTable(regionsTableName, (table) => {
    table.dropColumn('name')
  })
}
