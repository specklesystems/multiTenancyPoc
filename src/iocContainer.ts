import awilix from 'awilix'
import { saveResourceAclFactory, saveUserFactory } from './repositories'
import { Knex } from 'knex'
import { getMainDbClient } from './services/databaseManagement'

export const container = awilix.createContainer({
  strict: true,
  injectionMode: awilix.InjectionMode.PROXY
})

container.register({
  db: awilix.asFunction(getMainDbClient).singleton(),
  saveResource: awilix
    .asFunction((regionDb: Knex) => saveUserFactory({ db: regionDb }))
    .scoped(),
  saveResourceAcl: awilix.asFunction(saveResourceAclFactory).scoped()
})

container.resolve('saveResource')
