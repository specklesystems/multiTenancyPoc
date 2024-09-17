import { ApolloServer } from '@apollo/server'
import { resolvers } from './resolvers'
import { startStandaloneServer } from '@apollo/server/standalone'
import { readFileSync } from 'fs'
import { typeDefs as scalarTypeDefs } from 'graphql-scalars'
import { migrateAll } from './services/databaseManagement'

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

  await migrateAll()

  console.log(`🚀 Server ready at: ${url}`)
}

startServer()
  .then()
  .catch((err: Error) =>
    console.log(`🔥 failed to start server ${err.message}`)
  )
