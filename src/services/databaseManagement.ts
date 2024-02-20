import { POSTGRES_URL } from "../config";
import { RegionRepo, MainRepo } from "../repositories";
import knex, { Knex } from "knex";
import cryptoRandomString from "crypto-random-string";

const migrateToLatest = async (db: Knex): Promise<void> => {
  const plannedMigrations: Array<{ file: string }> = (
    await db.migrate.list()
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
  await db.migrate.latest();
};

export const migrateAll = async (): Promise<void> => {
  await migrateToLatest(mainRepo.db);
  const repos = await getAllRepositories();

  await Promise.all([
    ...repos.map(async (repo) => await migrateToLatest(repo.db)),
  ]);
};

const createDatabaseConfig = (
  connectionString: string,
  sslCaCert: string | null,
): Knex.Config => {
  const config: Knex.Config = {
    client: "pg",
    connection: {
      connectionString,
      ssl: sslCaCert
        ? {
            ca: sslCaCert,
            rejectUnauthorized: true,
          }
        : undefined,
    },
    migrations: {
      directory: "src/migrations",
      extension: "ts",
    },
  };
  return config;
};

const mainRepo = new MainRepo(knex(createDatabaseConfig(POSTGRES_URL, null)));

const _repoStore: Map<string, RegionRepo> = new Map();
export const getRegionRepo = async ({
  regionId,
}: {
  regionId: string | undefined;
}): Promise<RegionRepo> => {
  if (!regionId) return mainRepo;
  const maybeRepo = _repoStore.get(regionId);
  if (maybeRepo) return maybeRepo;
  const maybeRegion = await mainRepo.findRegion(regionId);
  if (!maybeRegion) throw Error(`region ${regionId} not found`);
  const repo = new RegionRepo(
    knex(
      createDatabaseConfig(maybeRegion.connectionString, maybeRegion.sslCaCert),
    ),
  );
  _repoStore.set(regionId, repo);
  return repo;
};

export const getMainRepo = (): MainRepo => mainRepo;

export const registerRegion = async ({
  name,
  connectionString,
  sslCaCert,
}: {
  name: string;
  connectionString: string;
  sslCaCert: string | null;
}): Promise<string> => {
  const regions = await mainRepo.queryRegions({ connectionString });
  if (regions.length) throw new Error("This region is already registered");
  const id = cryptoRandomString({ length: 10 });
  const repo = new RegionRepo(
    knex(createDatabaseConfig(connectionString, sslCaCert)),
  );
  await migrateToLatest(repo.db);
  _repoStore.set(id, repo);

  const sslmode = sslCaCert ? "require" : "disable";
  await setUpUserReplication({
    from: mainRepo.db,
    to: repo.db,
    regionName: name,
    sslmode,
  });
  await setUpResourceReplication({
    from: repo.db,
    to: mainRepo.db,
    regionName: name,
    sslmode,
  });

  await mainRepo.saveRegion({
    id,
    name,
    connectionString,
    sslCaCert,
  });
  return id;
};

export const createOrganization = async (name: string): Promise<string> => {
  const id = cryptoRandomString({ length: 10 });
  await mainRepo.saveOrganization({ id, name });
  return id;
};

type ReplicationArgs = {
  from: Knex;
  to: Knex;
  sslmode: string;
  regionName: string;
};

const setUpUserReplication = async ({
  from,
  to,
  sslmode,
  regionName,
}: ReplicationArgs): Promise<void> => {
  // TODO: ensure its created...
  try {
    await from.raw("CREATE PUBLICATION userspub FOR TABLE users;");
  } catch (err) {
    if (!(err instanceof Error)) throw err;
    if (!err.message.includes("already exists")) throw err;
  }

  const fromUrl = new URL(from.client.config.connection.connectionString);
  const fromDbName = fromUrl.pathname.replace("/", "");
  const subName = `userssub_${regionName}`;
  const rawSqeel = `SELECT * FROM aiven_extras.pg_create_subscription(
    '${subName}',
    'dbname=${fromDbName} host=${fromUrl.hostname} port=${fromUrl.port} sslmode=${sslmode} user=${fromUrl.username} password=${fromUrl.password}',
    'userspub', 
    '${subName}',
    TRUE,
    TRUE
  );`;
  try {
    await to.raw(rawSqeel);
  } catch (err) {
    if (!(err instanceof Error)) throw err;
    if (!err.message.includes("already exists")) throw err;
  }
};

const setUpResourceReplication = async ({
  from,
  to,
  regionName,
  sslmode,
}: ReplicationArgs): Promise<void> => {
  // TODO: ensure its created...
  try {
    await from.raw("CREATE PUBLICATION resourcepub FOR TABLE resources;");
  } catch (err) {
    if (!(err instanceof Error)) throw err;
    if (!err.message.includes("already exists")) throw err;
  }

  const fromUrl = new URL(from.client.config.connection.connectionString);
  const fromDbName = fromUrl.pathname.replace("/", "");
  const subName = `resourcesub_${regionName}`;
  const rawSqeel = `SELECT * FROM aiven_extras.pg_create_subscription(
    '${subName}',
    'dbname=${fromDbName} host=${fromUrl.hostname} port=${fromUrl.port} sslmode=${sslmode} user=${fromUrl.username} password=${fromUrl.password}',
    'resourcepub', 
    '${subName}',
    TRUE,
    TRUE
  );`;
  try {
    await to.raw(rawSqeel);
  } catch (err) {
    if (!(err instanceof Error)) throw err;
    if (!err.message.includes("already exists")) throw err;
  }
};

export const getAllRepositories = async (): Promise<RegionRepo[]> => {
  const regions = await mainRepo.queryRegions({});
  const regionRepos = await Promise.all(
    regions.map(async (region) => await getRegionRepo({ regionId: region.id })),
  );
  return [mainRepo, ...regionRepos];
};

export const getResourceRepo = async (
  resourceId: string,
): Promise<RegionRepo> => {
  const resourceRegion = await mainRepo.findResourceRegion({ resourceId });
  return resourceRegion ? await getRegionRepo(resourceRegion) : getMainRepo();
};
