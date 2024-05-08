import { getDB } from "./db";
import { Region } from "./regions";
import { UserRecord, Resource, ResourceAcl, Comment, ResourceView } from "./types";

const Users = () => getDB()<UserRecord>("users");
const Resources = (region: Region) => getDB(region)<Resource>("resources");
const ResourceViews = () => getDB()<ResourceView>("resource_views");
const ResourceAclRepo = () => getDB()<ResourceAcl>("resource_acl");
const Comments = () => getDB()<Comment>("comments");

export const queryUser = async (userId: string): Promise<UserRecord | null> => {
  return (await Users().where("id", "=", userId).first()) ?? null;
};

export const queryResource = async (
  resourceId: string,
): Promise<Resource | null> => {
  const resourceLocation = await ResourceViews().where('resourceId', '=', resourceId).first()
  if (!resourceLocation?.region) {
    return null
  }
  return await Resources(resourceLocation.region).where("id", "=", resourceId).first() || null;
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
  const query = ResourceViews()
    .join("resource_acl", "resource_views.resourceId", "resource_acl.resourceId")
    .where({ userId });
  if (cursor) {
    query.andWhere("resourceCreatedAt", "<", cursor);
  }
  return query.limit(limit);
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
  return query.limit(limit);
};

export async function upsertResourceView(region: Region, resource: Resource) {
  return ResourceViews().insert({
    resourceId: resource.id,
    resourceName: resource.name,
    resourceCreatedAt: resource.createdAt,
    region: region,
  }).onConflict('resourceId')
    .merge()
}
