export default {
  client: 'pg',
  connection: process.env.POSTGRES_URL,
  migrations: {
    directory: 'src/migrations',
    extension: 'ts'
  }
}
