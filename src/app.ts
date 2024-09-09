import { ApolloServer } from "@apollo/server";
import { resolvers } from "./resolvers";
import { startStandaloneServer } from "@apollo/server/standalone";
import { readFileSync } from "fs";
import { typeDefs as scalarTypeDefs } from "graphql-scalars";
import { mainDb } from "./db";
import Knex, { Knex as KnexType } from 'knex'
import knexfile from "../knexfile";
import { container } from "./compositionRoot";
import { asValue } from "awilix";

const typeDefs = readFileSync("src/schema.graphql", { encoding: "utf-8" });

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
  typeDefs: [typeDefs, ...scalarTypeDefs],
  resolvers,
});

const startServer = async (): Promise<void> => {
  const plannedMigrations: Array<{ file: string }> = (
    await mainDb.migrate.list()
  )[1];
  if (plannedMigrations.length > 0) {
    console.log(
      `🕰️  planning migrations: ${plannedMigrations
        .map((m) => m.file)
        .join(",")}`,
    );
  }
  await mainDb.migrate.latest();

  const regions = await mainDb('regions')
  const regionalDBs = new Map<string, KnexType>(regions.map(region => [region.name, Knex({ ...knexfile, connection: region.connectionString })]))
  await Promise.all(Array.from(regionalDBs.values()).map(db => db.migrate.latest())).catch(err => console.log({ err }))

  container.register({
    regionalDBs: asValue(regionalDBs),
  })

  const { url } = await startStandaloneServer(server, {
    listen: { port: 3000 },
    context: async ({ req }) => {
      const scope = container.createScope(); // Create a scope per request
      return {
        container: scope,
        // Add any other custom context, like user from req if needed
      };
    },
  });
  console.log(`🚀 Server ready at: ${url}`);
};

startServer()
  .then()
  .catch((err: Error) => {
    console.log({ err });
    console.log(`🔥 failed to start server ${err.message}`);
  });
