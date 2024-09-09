import { Knex } from "knex";
import { UserRecord, Resource, ResourceAcl, Comment, ResourceMeta } from "./types";

const tables = {
  users: (db: Knex) => db<UserRecord>('users'),
  resources: (db: Knex) => db<Resource>('resources'),
  resourceAcl: (db: Knex) => db<ResourceAcl>('resource_acl'),
  comments: (db: Knex) => db<Comment>('comments'),
  resourceMeta: (db: Knex) => db<ResourceMeta>('resource_meta'),
}

export const queryUser = ({ mainDB }: { mainDB: Knex }) => async (userId: string): Promise<UserRecord | null> => {
  return (await tables.users(mainDB).where("id", "=", userId).first()) ?? null;
};

export const queryResource = ({ mainDB, regionalDBs }: { mainDB: Knex, regionalDBs: Map<string, Knex> }) => async (
  resourceId: string,
): Promise<Resource | null> => {
  const resourceMeta = await tables.resourceMeta(mainDB).where({ resourceId }).first()
  const regionalDB = regionalDBs.get(resourceMeta!.region)!
  return (await tables.resources(regionalDB).where("id", "=", resourceId).first()) ?? null;
};

export const queryResourceAcl = ({ mainDB }: { mainDB: Knex }) => async ({
  resourceId,
  userId,
}: {
  resourceId: string;
  userId: string;
}): Promise<ResourceAcl | null> => {
  return (
    (await tables.resourceAcl(mainDB)
      .where("userId", "=", userId)
      .andWhere("resourceId", "=", resourceId)
      .first()) ?? null
  );
};

export const countResources = ({ mainDB }: { mainDB: Knex }) => async (userId: string): Promise<number> => {
  const [rawCount] = await tables.resourceAcl(mainDB).count().where({ userId });
  return parseInt(rawCount.count as string);
};

export const queryResources = ({ mainDB, regionalDBs }: { mainDB: Knex; regionalDBs: Record<string, Knex> }) => async ({
  userId,
  limit,
  cursor,
}: {
  userId: string;
  limit: number;
  cursor: string | null;
}) => {
  const resourceMeta = await tables.resourceMeta(mainDB).where({ resourceId }).first()
  const regionalDB = regionalDBs[resourceMeta!.region]
  const query = Resources()
    .join("resource_acl", "resources.id", "resource_acl.resourceId")
    .where({ userId });
  if (cursor) {
    query.andWhere("createdAt", "<", cursor);
  }
  return await query.limit(limit);
};

export const countComments = ({ mainDB }: { mainDB: Knex }) => async (resourceId: string): Promise<number> => {
  const [rawCount] = await tables.comments(mainDB).count().where({ resourceId });
  return parseInt(rawCount.count as string);
};

export const queryComments = ({ mainDB }: { mainDB: Knex }) => async ({
  resourceId,
  limit,
  cursor,
}: {
  resourceId: string;
  limit: number;
  cursor: string | null;
}): Promise<Comment[]> => {
  const query = tables.comments(mainDB).where({ resourceId });
  if (cursor) {
    query.andWhere("createdAt", "<", cursor);
  }
  return await query.limit(limit);
};
