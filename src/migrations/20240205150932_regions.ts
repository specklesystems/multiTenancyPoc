import type { Knex } from "knex";

const regionsTableName = "regions";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(regionsTableName, (table) => {
    table.text("id").primary();
    table.text("connectionString");
  });
  await knex.schema.createTable("organizations_regions", (table) => {
    table
      .text("organizationId")
      .references("id")
      .inTable("organizations")
      .notNullable()
      .onDelete("cascade");
    table
      .text("regionId")
      .references("id")
      .inTable("regions")
      .notNullable()
      .onDelete("cascade");
  });
  await knex.schema.createTable("resource_organization_region", (table) => {
    table
      .text("resourceId")
      .references("id")
      .inTable("resources")
      .notNullable()
      .onDelete("cascade");
    table
      .text("organizationId")
      .references("id")
      .inTable("organizations")
      .notNullable()
      .onDelete("cascade");
    table
      .text("regionId")
      .references("id")
      .inTable("regions")
      .notNullable()
      .onDelete("cascade");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(regionsTableName);
  await knex.schema.dropTable("organizations_regions");
}
