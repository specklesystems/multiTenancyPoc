import type { Knex } from 'knex'

const tableName = 'resource_views'

export async function up(knex: Knex): Promise<void> {
  return await knex.schema.createTable(tableName, (table) => {
    table.string('resourceId').primary()
    table.string('region')
    table.string('resourceName')
    table.datetime('resourceCreatedAt')
  })
}

export async function down(knex: Knex): Promise<void> {
  return await knex.schema.dropTable(tableName)
}
