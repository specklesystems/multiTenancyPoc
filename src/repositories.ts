import { Knex } from "knex";
import { knex } from "./db";
import {
  UserRecord,
  Resource,
  ResourceAcl,
  Comment,
  Region,
  OrganizationsRegions,
  Organization,
  OrganizationAcl,
  OrganizationResourceAcl,
  ResourceRegion,
  ResourceRegionOrg,
} from "./types";

const Users = () => knex<UserRecord>("users");
const Resources = () => knex<Resource>("resources");
const ResourceAclRepo = () => knex<ResourceAcl>("resource_acl");

export const queryUser = async (userId: string): Promise<UserRecord | null> => {
  return (await Users().where("id", "=", userId).first()) ?? null;
};

export const getUsersFrom = (db: Knex) => async (): Promise<UserRecord[]> => {
  return await db<UserRecord>("users").select();
};

export const saveUserTo =
  (db: Knex) =>
  async (user: UserRecord): Promise<void> => {
    await db<UserRecord>("users").insert(user);
  };

export const saveResourceTo =
  (db: Knex) =>
  async (resource: Resource): Promise<void> => {
    await db<Resource>("resources").insert(resource);
  };

export const queryResourceFrom =
  (db: Knex) =>
  async (resourceId: string): Promise<Resource | null> => {
    return (
      (await db<Resource>("resources").where({ id: resourceId }).first()) ??
      null
    );
  };

export const queryResourceAclFrom =
  (db: Knex) =>
  async ({ resourceId, userId }: ResourceAcl): Promise<ResourceAcl | null> => {
    return (
      (await db<ResourceAcl>("resource_acl")
        .where({ userId, resourceId })
        .first()) ?? null
    );
  };

export const saveResourceAclTo =
  (db: Knex) =>
  async (resourceAcl: ResourceAcl): Promise<void> => {
    await db<ResourceAcl>("resource_acl").insert(resourceAcl);
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

export const countCommentsIn =
  (db: Knex) =>
  async (resourceId: string): Promise<number> => {
    const [rawCount] = await db<Comment>("comments")
      .count()
      .where({ resourceId });
    return parseInt(rawCount.count as string);
  };

export const queryCommentsFrom =
  (db: Knex) =>
  async ({
    resourceId,
    limit,
    cursor,
  }: {
    resourceId: string;
    limit: number;
    cursor: string | null;
  }): Promise<Comment[]> => {
    const query = db<Comment>("comments").where({ resourceId });
    if (cursor) {
      query.andWhere("createdAt", "<", cursor);
    }
    return await query.limit(limit);
  };

export const saveCommentTo =
  (db: Knex) =>
  async (comment: Comment): Promise<void> => {
    await db<Comment>("comments").insert(comment);
  };

export const getRegionsFrom = (db: Knex) => async (): Promise<Array<Region>> =>
  await db<Region>("regions").select();

export const getRegionFrom =
  (db: Knex) =>
  async (id: string): Promise<Region | null> =>
    (await db<Region>("regions").where({ id }).first()) ?? null;

export const getOrganizationRegionsFrom =
  (db: Knex) => async (): Promise<Array<OrganizationsRegions>> =>
    await db<OrganizationsRegions>("organizations_regions").select();

export const queryOrganizationRegionsFrom =
  (db: Knex) =>
  async ({
    regionId,
    organizationId,
  }: OrganizationsRegions): Promise<OrganizationsRegions | null> =>
    (await db<OrganizationsRegions>("organizations_regions")
      .where({ regionId, organizationId })
      .first()) ?? null;

export const saveRegionTo = (db: Knex) => async (region: Region) =>
  await db<Region>("regions").insert(region);

export const saveOrganizationTo =
  (db: Knex) => async (organization: Organization) =>
    await db<Organization>("organizations").insert(organization);

export const getOrganizationFrom =
  (db: Knex) =>
  async (id: string): Promise<Organization | null> => {
    return (
      (await db<Organization>("organizations").where({ id }).first()) ?? null
    );
  };

export const getOrganizationsFrom =
  (db: Knex) => async (): Promise<Organization[]> =>
    await db<Organization>("organizations").select();

export const saveOrganizationsRegionsTo =
  (db: Knex) =>
  async (or: OrganizationsRegions): Promise<void> =>
    await db<OrganizationsRegions>("organizations_regions").insert(or);

export const saveOrganizationAclTo =
  (db: Knex) =>
  async (orgAcl: OrganizationAcl): Promise<void> => {
    await db<OrganizationsRegions>("organization_acl").insert(orgAcl);
  };

export const queryOrganizationAclFrom =
  (db: Knex) =>
  async ({
    userId,
    organizationId,
  }: OrganizationAcl): Promise<OrganizationAcl | null> =>
    (await db<OrganizationAcl>("organization_acl")
      .where({ userId, organizationId })
      .first()) ?? null;

export const saveOrganizationResourceAclTo =
  (db: Knex) =>
  async (item: OrganizationResourceAcl): Promise<void> => {
    await db<OrganizationResourceAcl>("organization_resource_acl").insert(item);
  };

export const saveResourceRegionOrganizationTo =
  (db: Knex) => async (item: ResourceRegionOrg) => {
    await db<ResourceRegionOrg>("resource_region_organization").insert(item);
  };

export const queryResourceRegionOrganizationFrom =
  (db: Knex) =>
  async (resourceId: string): Promise<ResourceRegion | null> =>
    (await db<ResourceRegionOrg>("resource_region_organization")
      .where({ resourceId })
      .first()) ?? null;
