import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return await knex.schema.createTable('resource_meta', (table) => {
    table.text('id').primary()
    table.text('resourceId').references('id').inTable('resources')
    table.text('region')
  })
}


export async function down(knex: Knex): Promise<void> {
  return await knex.schema.dropTable('resource_meta')
}

