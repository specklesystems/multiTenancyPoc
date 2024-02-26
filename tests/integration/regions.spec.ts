import { expect, beforeAll, describe, it } from 'vitest'
import {
  getOrganizationRegionsFrom,
  getRegionsFrom
} from '../../src/repositories'
import {
  getMainDbClient,
  migrateAll
} from '../../src/services/databaseManagement'
import { Knex } from 'knex'

describe('regions', () => {
  let dbClient: Knex

  beforeAll(async () => {
    dbClient = await getMainDbClient()
  })
  it('gets all regions', async () => {
    const regions = await getRegionsFrom(dbClient)()
    expect(regions.length).toBeGreaterThan(0)
  })
  it('gets organizations regions', async () => {
    const orgRegions = await getOrganizationRegionsFrom(dbClient)()
    expect(orgRegions.length).toBeGreaterThan(0)
  })
  it('migrates all', async () => {
    await migrateAll()
  })
})
