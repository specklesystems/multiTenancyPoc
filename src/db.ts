import Knex from 'knex'
import config from './config'
import knexfile from '../knexfile'

const knexConfig = {
  ...knexfile,
  connection: config.MAIN_DB_URI,
}

export const mainDb = Knex(knexConfig)
