import { knex } from "./db";
import { UserRecord, Resource, ResourceAcl, Comment } from "./types";

const Users = () => knex<UserRecord>("users");
const Resources = () => knex<Resource>("resources");
const ResourceAclRepo = () => knex<ResourceAcl>("resource_acl");
const Comments = () => knex<Comment>("comments");

export const queryUser = async (userId: string): Promise<UserRecord | null> => {
  return (await Users().where("id", "=", userId).first()) ?? null;
};

export const queryResource = async (
  resourceId: string,
): Promise<Resource | null> => {
  return (await Resources().where("id", "=", resourceId).first()) ?? null;
};

export const queryResourceAcl = async ({
  resourceId,
  userId,
}: {
  resourceId: string;
  userId: string;
}): Promise<ResourceAcl | null> => {
  return (
    (await ResourceAclRepo()
      .where("userId", "=", userId)
      .andWhere("resourceId", "=", resourceId)
      .first()) ?? null
  );
};

export const countResources = async (userId: string): Promise<number> => {
  const [rawCount] = await ResourceAclRepo().count().where({ userId });
  return parseInt(rawCount.count as string);
};

export const queryResources = async ({
  userId,
  limit,
  cursor,
}: {
  userId: string;
  limit: number;
  cursor: string | null;
}) => {
  const query = Resources()
    .join("resource_acl", "resources.id", "resource_acl.resourceId")
    .where({ userId });
  if (cursor) {
    query.andWhere("createdAt", "<", cursor);
  }
  return await query.limit(limit);
};

export const countComments = async (resourceId: string): Promise<number> => {
  const [rawCount] = await Comments().count().where({ resourceId });
  return parseInt(rawCount.count as string);
};

export const queryComments = async ({
  resourceId,
  limit,
  cursor,
}: {
  resourceId: string;
  limit: number;
  cursor: string | null;
}): Promise<Comment[]> => {
  const query = Comments().where({ resourceId });
  if (cursor) {
    query.andWhere("createdAt", "<", cursor);
  }
  return await query.limit(limit);
};
