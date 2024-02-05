import type { Knex } from 'knex'

const tableName = 'resources'

export async function up (knex: Knex): Promise<void> {
  return await knex.schema.createTable(tableName, (table) => {
    table.text('id').primary()
    table.text('name').notNullable()
    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
  })
}

export async function down (knex: Knex): Promise<void> {
  return await knex.schema.dropTable(tableName)
}
