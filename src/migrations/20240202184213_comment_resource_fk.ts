import type { Knex } from 'knex'

const tableName = 'comments'

export async function up (knex: Knex): Promise<void> {
  return await knex.schema.alterTable(tableName, (table) => {
    table.string('resourceId').references('id').inTable('resources')
  })
}

export async function down (knex: Knex): Promise<void> {
  return await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn('resourceId')
  })
}
