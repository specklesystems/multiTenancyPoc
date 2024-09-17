import { Knex } from 'knex'
import fs from 'fs'
import path from 'path'

console.log(`foobar ${process.env.POSTGRES_CA_CERT_PATH}`)

const config: Knex.Config = {
  client: 'pg',
  connection: {
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.POSTGRES_CA_CERT_PATH
      ? {
          ca: fs.readFileSync(
            path.resolve(__dirname, process.env.POSTGRES_CA_CERT_PATH)
          ),
          rejectUnauthorized: true
        }
      : undefined
  },
  migrations: {
    directory: 'src/migrations',
    extension: 'ts'
  }
}

export default config
