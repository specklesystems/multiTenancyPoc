import { ApolloServer } from '@apollo/server'
import { resolvers } from './resolvers'
import { startStandaloneServer } from '@apollo/server/standalone'
import { readFileSync } from 'fs'
import { typeDefs as scalarTypeDefs } from 'graphql-scalars'
import { getDB } from './db'
import { Regions } from './regions'
import { initListeners } from './listeners'

const typeDefs = readFileSync('src/schema.graphql', { encoding: 'utf-8' })

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
  typeDefs: [typeDefs, ...scalarTypeDefs],
  resolvers
})

const startServer = async (): Promise<void> => {
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 }
  })

  const mainDB = getDB()
  const regionDBs = Regions.map(region => getDB(region))

  const databases = [mainDB, ...regionDBs]

  for (const db of databases) {
    const plannedMigrations: Array<{ file: string }> = (
      await db.migrate.list()
    )[1]
    if (plannedMigrations.length > 0) {
      console.log(
        `🕰️  planning migrations: ${plannedMigrations
          .map((m) => m.file)
          .join(',')}`
      )
    }

    await db.migrate.latest()
  }

  await initListeners()
  console.log(`🚀 Server ready at: ${url}`)
}

startServer()
  .then()
  .catch((err: Error) =>
    console.log(`🔥 failed to start server ${err.message}`)
  )
