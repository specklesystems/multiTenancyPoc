import type { Knex } from "knex";

const tableName = "organization_acl";

export async function up(knex: Knex): Promise<void> {
  return await knex.schema.createTable(tableName, (table) => {
    table
      .string("userId")
      .references("id")
      .inTable("users")
      .onDelete("cascade");
    table
      .string("organizationId")
      .references("id")
      .inTable("organizations")
      .onDelete("cascade");
  });
}

export async function down(knex: Knex): Promise<void> {
  return await knex.schema.dropTable(tableName);
}