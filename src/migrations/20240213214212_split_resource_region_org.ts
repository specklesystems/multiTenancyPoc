import type { Knex } from 'knex'

const tableName = 'resource_region_organization'

export async function up (knex: Knex): Promise<void> {
  await knex.schema.dropTable(tableName)
  await knex.schema.createTable('resource_region', (table) => {
    table
      .string('resourceId')
      .references('id')
      .inTable('resources')
      .onDelete('cascade')
      .primary()
    table
      .string('regionId')
      .references('id')
      .inTable('regions')
      .onDelete('cascade')
  })
  await knex.schema.createTable('resource_organization', (table) => {
    table
      .string('resourceId')
      .references('id')
      .inTable('resources')
      .onDelete('cascade')
      .primary()
    table
      .string('organizationId')
      .references('id')
      .inTable('organizations')
      .onDelete('cascade')
  })
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.dropTable('resource_organization')
  await knex.schema.dropTable('resource_region')
  await knex.schema.createTable(tableName, (table) => {
    table
      .string('resourceId')
      .references('id')
      .inTable('resources')
      .onDelete('cascade')
      .primary()
    table
      .string('regionId')
      .references('id')
      .inTable('regions')
      .onDelete('cascade')
    table
      .string('organizationId')
      .references('id')
      .inTable('organizations')
      .onDelete('cascade')
  })
}
