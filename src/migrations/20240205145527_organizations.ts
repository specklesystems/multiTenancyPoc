import type { Knex } from "knex";

const tableName = "organizations";

export async function up(knex: Knex): Promise<void> {
  return await knex.schema.createTable(tableName, (table) => {
    table.text("id").primary();
    table.text("name");
  });
}

export async function down(knex: Knex): Promise<void> {
  return await knex.schema.dropTable(tableName);
}
