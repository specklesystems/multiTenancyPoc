import Knex, { Knex as KnexClient } from 'knex'
import { mainDBConfig, euDBConfig, usDBConfig } from '../knexfile'
import { Region } from './regions'

const mainDB = Knex(mainDBConfig)
const regionDBs = new Map<Region, KnexClient>([['eu', Knex(euDBConfig)], ['us', Knex(usDBConfig)]])

export function getDB(region?: Region) {
  if (!region) {
    return mainDB
  }

  const db = regionDBs.get(region)

  if (!db) {
    throw new Error('Region not supported')
  }
  return db
}
