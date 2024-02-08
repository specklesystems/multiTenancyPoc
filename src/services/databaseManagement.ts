import { POSTGRES_URL } from "../config";
import {
  getOrganizationFrom,
  getOrganizationRegionsFrom,
  getRegionFrom,
  queryResourceRegionOrganizationFrom,
  saveOrganizationTo,
  saveOrganizationsRegionsTo,
  saveRegionTo,
} from "../repositories";
import { OrganizationsRegions, Region } from "../types";
import knex, { Knex } from "knex";
import cryptoRandomString from "crypto-random-string";

const migrateToLatest = async (client: Knex): Promise<void> => {
  const plannedMigrations: Array<{ file: string }> = (
    await client.migrate.list()
  )[1];
  if (plannedMigrations.length > 0) {
    console.log(
      `🕰️  planning migrations: ${plannedMigrations
        .map((m) => m.file)
        .join(",")}`,
    );
  } else {
    console.log("no migrations are planned");
  }
  // TODO: make sure if a migration fails, all migrations are rolled back
  await client.migrate.latest();
};

export const migrateAll = async (): Promise<void> => {
  const databaseSchemas = await getAllDatabaseSchemaConnections();

  await Promise.all(
    databaseSchemas.map(async (sc) => await migrateToLatest(sc)),
  );
  // 1. get all regions from main DB
  // 2. construct region specific knex clients and cache them by
  // 3. structure the cache so that it accomodates client creation by resource id
  // 4. get all organization regions from main DB
  // 5. for in all regions for all organizations, run the migration
  // 6. do not forget the migration for the main DB
  //
};

const createDatabaseConfig = (connectionString: string): Knex.Config => {
  return {
    client: "pg",
    connection: {
      connectionString,
    },
    // connection: connectionString,
    migrations: {
      directory: "src/migrations",
      extension: "ts",
    },
  };
};

const mainClient = knex(createDatabaseConfig(POSTGRES_URL));

const _connectionStore: Map<string, Knex> = new Map();

interface RegionWithMaybeOrganization {
  regionId: string;
  organizationId?: string | undefined;
}

const _createConnectionKey = ({
  organizationId,
  regionId,
}: RegionWithMaybeOrganization): string => {
  return organizationId ? `${organizationId}@${regionId}` : regionId;
};

export const getDbClient = async ({
  regionId,
  organizationId,
}: RegionWithMaybeOrganization): Promise<Knex> => {
  const connectionKey = _createConnectionKey({ organizationId, regionId });
  const maybeClient = _connectionStore.get(connectionKey);
  if (maybeClient) return maybeClient;
  const maybeRegion = await mainClient<Region>("regions")
    .select()
    .where({ id: regionId })
    .first();
  if (!maybeRegion) throw Error(`region ${regionId} not found`);
  const connectionString = organizationId
    ? `${maybeRegion.connectionString}/${organizationId}`
    : `${maybeRegion.connectionString}/${maybeRegion.maintenanceDb}`;
  const client = knex(createDatabaseConfig(connectionString));
  _connectionStore.set(connectionKey, client);
  return client;
};

export const getMainDbClient = (): Knex => mainClient;

export const registerRegion = async ({
  name,
  connectionString,
  maintenanceDb,
}: {
  name: string;
  connectionString: string;
  maintenanceDb: string;
}): Promise<string> => {
  // TODO: validate the connectionString, so that the knex client can connect to it
  const id = cryptoRandomString({ length: 10 });
  await saveRegionTo(mainClient)({
    id,
    name,
    connectionString,
    maintenanceDb,
  });
  return id;
};

export const createOrganization = async (name: string): Promise<string> => {
  const id = cryptoRandomString({ length: 10 });
  await saveOrganizationTo(mainClient)({ id, name });
  return id;
};

const createDb = async (client: Knex, name: string): Promise<void> => {
  try {
    await client.raw(`create database "${name}"`);
  } catch (err) {
    if (!(err instanceof Error)) throw err;
    if (!err.message.includes("already exists")) throw err;
  }
};

const setUpUserReplication = async ({
  from,
  to,
}: {
  from: Knex;
  to: Knex;
}): Promise<void> => {
  // TODO: ensure its created...
  const connectionString: string =
    from.client.config.connection.connectionString;
  try {
    await from.raw("CREATE PUBLICATION userspub FOR TABLE users;");
  } catch (err) {
    if (!(err instanceof Error)) throw err;
    if (!err.message.includes("already exists")) throw err;
  }
  try {
    const toUrl = new URL(to.client.config.connection.connectionString);
    await to.raw(
      `CREATE SUBSCRIPTION userssub_${toUrl.pathname.replace("/", "")} CONNECTION '${connectionString}' PUBLICATION userspub;`,
    );
  } catch (err) {
    if (!(err instanceof Error)) throw err;
    if (!err.message.includes("already exists")) throw err;
  }
};

const setUpResourceReplication = async ({
  from,
  fromRegionName,
  to,
}: {
  from: Knex;
  fromRegionName: string;
  to: Knex;
}): Promise<void> => {
  // TODO: ensure its created...
  const connectionString: string =
    from.client.config.connection.connectionString;
  const connUrl = new URL(connectionString);
  try {
    await from.raw("CREATE PUBLICATION resourcepub FOR TABLE resources;");
  } catch (err) {
    if (!(err instanceof Error)) throw err;
    if (!err.message.includes("already exists")) throw err;
  }
  try {
    await to.raw(
      `CREATE SUBSCRIPTION "resroucesub_${fromRegionName.replace(
        " ",
        "",
      )}_${connUrl.pathname.replace(
        "/",
        "",
      )}" CONNECTION '${connectionString}' PUBLICATION resourcepub;`,
    );
  } catch (err) {
    if (!(err instanceof Error)) throw err;
    if (!err.message.includes("already exists")) throw err;
  }
};

export const bindRegionToOrganization = async ({
  regionId,
  organizationId,
}: OrganizationsRegions): Promise<void> => {
  const region = await getRegionFrom(mainClient)(regionId);
  if (!region) throw Error(`region ${regionId} not found`);
  const organization = await getOrganizationFrom(mainClient)(organizationId);
  if (!organization) throw Error(`organization ${organizationId} not found`);

  const regionClient = await getDbClient({ regionId });

  await createDb(regionClient, organizationId);

  const client = await getDbClient({ organizationId, regionId });
  const connectionKey = _createConnectionKey({ organizationId, regionId });

  await migrateToLatest(client);

  await setUpUserReplication({ from: mainClient, to: client });
  await setUpResourceReplication({
    from: client,
    fromRegionName: region.name,
    to: mainClient,
  });

  _connectionStore.set(connectionKey, client);
  await saveOrganizationsRegionsTo(mainClient)({ organizationId, regionId });
};

export const getAllDatabaseSchemaConnections = async (): Promise<Knex[]> => {
  const organizationRegions = await getOrganizationRegionsFrom(mainClient)();
  const clients = await Promise.all(
    organizationRegions.map(async (or) => {
      const client = await getDbClient(or);
      return client;
    }),
  );
  return [mainClient, ...clients];
};

export const getResourceDatabaseConnection = async (
  resourceId: string,
): Promise<Knex> => {
  const resourceRegionOrg =
    await queryResourceRegionOrganizationFrom(mainClient)(resourceId);
  return resourceRegionOrg ? await getDbClient(resourceRegionOrg) : mainClient;
};
