import { asFunction, asValue, createContainer, InjectionMode } from 'awilix'
import { mainDb } from './db'
import { countComments, countResources, queryComments, queryResource, queryResourceAcl, queryUser } from './repositories'

export const container = createContainer({
  injectionMode: InjectionMode.PROXY,
  strict: true,
}).register({
  mainDB: asValue(mainDb),
  queryUser: asFunction(queryUser).scoped(),
  queryResource: asFunction(queryResource).scoped(),
  queryResourceAcl: asFunction(queryResourceAcl).scoped(),
  countResources: asFunction(countResources).scoped(),
  countComments: asFunction(countComments).scoped(),
  queryComments: asFunction(queryComments).scoped(),
})

