import { POSTGRES_URL } from '../config'
import knex, { Knex } from 'knex'
import cryptoRandomString from 'crypto-random-string'
import {
  findRegionFactory,
  findResourceRegionFactory,
  queryRegionsFactory,
  saveOrganizationFactory,
  saveRegionFactory
} from '../repositories'

const migrateToLatest = async (db: Knex): Promise<void> => {
  const plannedMigrations: Array<{ file: string }> = (
    await db.migrate.list()
  )[1]
  if (plannedMigrations.length > 0) {
    console.log(
      `🕰️  planning migrations: ${plannedMigrations
        .map((m) => m.file)
        .join(',')}`
    )
  } else {
    console.log('no migrations are planned')
  }
  // TODO: make sure if a migration fails, all migrations are rolled back
  await db.migrate.latest()
}

export const migrateAll = async (): Promise<void> => {
  await migrateToLatest(db)
  const dbClients = await getAllDbClients()

  await Promise.all([
    ...dbClients.map(async (db) => await migrateToLatest(db))
  ])
}

const createDatabaseConfig = (
  connectionString: string,
  sslCaCert: string | null
): Knex.Config => {
  const config: Knex.Config = {
    client: 'pg',
    connection: {
      connectionString,
      ssl: sslCaCert
        ? {
            ca: sslCaCert,
            rejectUnauthorized: true
          }
        : undefined
    },
    migrations: {
      directory: 'src/migrations',
      extension: 'ts'
    }
  }
  return config
}

const db = knex(createDatabaseConfig(POSTGRES_URL, null))

const dbClientStore: Map<string, Knex> = new Map()

const findRegion = findRegionFactory({ db })

export const getRegionDb = async ({
  regionId
}: {
  regionId: string | undefined
}): Promise<Knex> => {
  if (!regionId) return db
  const maybeClient = dbClientStore.get(regionId)
  if (maybeClient != null) return maybeClient
  const maybeRegion = await findRegion(regionId)
  if (maybeRegion == null) throw Error(`region ${regionId} not found`)
  const client = knex(
    createDatabaseConfig(maybeRegion.connectionString, maybeRegion.sslCaCert)
  )
  dbClientStore.set(regionId, client)
  return client
}

export const getMainDbClient = (): Knex => db

const queryRegions = queryRegionsFactory({ db })
const saveRegion = saveRegionFactory({ db })

export const registerRegion = async ({
  name,
  connectionString,
  sslCaCert
}: {
  name: string
  connectionString: string
  sslCaCert: string | null
}): Promise<string> => {
  const regions = await queryRegions({ connectionString })
  if (regions.length > 0) throw new Error('This region is already registered')
  const id = cryptoRandomString({ length: 10 })
  const newDb = knex(createDatabaseConfig(connectionString, sslCaCert))
  await migrateToLatest(newDb)
  dbClientStore.set(id, newDb)

  const sslmode = sslCaCert ? 'require' : 'disable'
  await setUpUserReplication({
    from: db,
    to: newDb,
    regionName: name,
    sslmode
  })
  await setUpResourceReplication({
    from: newDb,
    to: db,
    regionName: name,
    sslmode
  })

  await saveRegion({
    id,
    name,
    connectionString,
    sslCaCert
  })
  return id
}

const saveOrganization = saveOrganizationFactory({ db })

export const createOrganization = async (name: string): Promise<string> => {
  const id = cryptoRandomString({ length: 10 })
  await saveOrganization({ id, name })
  return id
}

interface ReplicationArgs {
  from: Knex
  to: Knex
  sslmode: string
  regionName: string
}

const setUpUserReplication = async ({
  from,
  to,
  sslmode,
  regionName
}: ReplicationArgs): Promise<void> => {
  // TODO: ensure its created...
  try {
    await from.raw('CREATE PUBLICATION userspub FOR TABLE users;')
  } catch (err) {
    if (!(err instanceof Error)) throw err
    if (!err.message.includes('already exists')) throw err
  }

  const fromUrl = new URL(from.client.config.connection.connectionString)
  const fromDbName = fromUrl.pathname.replace('/', '')
  const subName = `userssub_${regionName}`
  const rawSqeel = `SELECT * FROM aiven_extras.pg_create_subscription(
    '${subName}',
    'dbname=${fromDbName} host=${fromUrl.hostname} port=${fromUrl.port} sslmode=${sslmode} user=${fromUrl.username} password=${fromUrl.password}',
    'userspub', 
    '${subName}',
    TRUE,
    TRUE
  );`
  try {
    await to.raw(rawSqeel)
  } catch (err) {
    if (!(err instanceof Error)) throw err
    if (!err.message.includes('already exists')) throw err
  }
}

const setUpResourceReplication = async ({
  from,
  to,
  regionName,
  sslmode
}: ReplicationArgs): Promise<void> => {
  // TODO: ensure its created...
  try {
    await from.raw('CREATE PUBLICATION resourcepub FOR TABLE resources;')
  } catch (err) {
    if (!(err instanceof Error)) throw err
    if (!err.message.includes('already exists')) throw err
  }

  const fromUrl = new URL(from.client.config.connection.connectionString)
  const fromDbName = fromUrl.pathname.replace('/', '')
  const subName = `resourcesub_${regionName}`
  const rawSqeel = `SELECT * FROM aiven_extras.pg_create_subscription(
    '${subName}',
    'dbname=${fromDbName} host=${fromUrl.hostname} port=${fromUrl.port} sslmode=${sslmode} user=${fromUrl.username} password=${fromUrl.password}',
    'resourcepub', 
    '${subName}',
    TRUE,
    TRUE
  );`
  try {
    await to.raw(rawSqeel)
  } catch (err) {
    if (!(err instanceof Error)) throw err
    if (!err.message.includes('already exists')) throw err
  }
}

export const getAllDbClients = async (): Promise<Knex[]> => {
  const regions = await queryRegions({})
  const regionClients = await Promise.all(
    regions.map(async (region) => await getRegionDb({ regionId: region.id }))
  )
  return [db, ...regionClients]
}

const findResourceRegion = findResourceRegionFactory({ db })

export const getResourceDb = async (resourceId: string): Promise<Knex> => {
  const resourceRegion = await findResourceRegion({ resourceId })
  return resourceRegion != null ? await getRegionDb(resourceRegion) : db
}
