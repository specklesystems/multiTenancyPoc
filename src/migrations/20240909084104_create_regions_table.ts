import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return await knex.schema.createTable('regions', (table) => {
    table.text('id').primary()
    table.text('name')
    table.text('connectionString')
  })
}


export async function down(knex: Knex): Promise<void> {
  return await knex.schema.dropTable('regions')
}

