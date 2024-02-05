import type { Knex } from 'knex'

const tableName = 'comments'

export async function up (knex: Knex): Promise<void> {
  return await knex.schema.createTable(tableName, (table) => {
    table.text('id').primary()
    table.text('content').notNullable()
    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())

    table.string('userId').references('id').inTable('users')
  })
}

export async function down (knex: Knex): Promise<void> {
  return await knex.schema.dropTable(tableName)
}
