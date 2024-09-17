import { Knex } from 'knex'
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
  ResourceRegion
} from './types'

export const saveResourceFactory =
  ({ db }: { db: Knex }) =>
    async (resource: Resource): Promise<void> => {
      await db<Resource>('resources').insert(resource)
    }

export const findResourceFactory =
  ({ db }: { db: Knex }) =>
    async (resourceId: string): Promise<Resource | null> => {
      return (
        (await db<Resource>('resources').where({ id: resourceId }).first()) ??
      null
      )
    }

export const saveCommentFactory =
  ({ db }: { db: Knex }) =>
    async (comment: Comment): Promise<void> => {
      await db<Comment>('comments').insert(comment)
    }

export const countCommentsFactory =
  ({ db }: { db: Knex }) =>
    async (resourceId: string): Promise<number> => {
      const [rawCount] = await db<Comment>('comments')
        .count()
        .where({ resourceId })
      return parseInt(rawCount.count as string)
    }

export const findUserFactory =
  ({ db }: { db: Knex }) =>
    async (userId: string): Promise<UserRecord | null> => {
      return (
        (await db<UserRecord>('users').where('id', '=', userId).first()) ?? null
      )
    }

export const queryUsersFactoy =
  ({ db }: { db: Knex }) =>
    async (): Promise<UserRecord[]> => {
      return await db<UserRecord>('users').select()
    }

export const saveUserFactory =
  ({ db }: { db: Knex }) =>
    async (user: UserRecord): Promise<void> => {
      await db<UserRecord>('users').insert(user)
    }

export const getUsersResourceAclFactory =
  ({ db }: { db: Knex }) =>
    async ({ resourceId, userId }: ResourceAcl): Promise<ResourceAcl | null> => {
      return (
        (await db<ResourceAcl>('resource_acl')
          .where({ userId, resourceId })
          .first()) ?? null
      )
    }

export const saveResourceAclFactory =
  ({ db }: { db: Knex }) =>
    async (resourceAcl: ResourceAcl): Promise<void> => {
      await db<ResourceAcl>('resource_acl').insert(resourceAcl)
    }

export const countUsersResourcesFactory =
  ({ db }: { db: Knex }) =>
    async (userId: string): Promise<number> => {
      const [rawCount] = await db<ResourceAcl>('resource_acl')
        .count()
        .where({ userId })
      return parseInt(rawCount.count as string)
    }

export const findUsersResourceFactory =
  ({ db }: { db: Knex }) =>
    async ({ resourceId, userId }: ResourceAcl): Promise<ResourceAcl | null> => {
      return (
        (await db<ResourceAcl>('resource_acl')
          .where({ userId, resourceId })
          .first()) ?? null
      )
    }

export const queryResourcesFactory =
  ({ db }: { db: Knex }) =>
    async ({
      userId,
      limit,
      cursor
    }: {
      userId: string
      limit: number
      cursor: string | null
    }): Promise<Resource[]> => {
      let query = db<Resource & ResourceAcl>('resources')
        .join('resource_acl', 'resources.id', 'resource_acl.resourceId')
        .where({ userId })
      if (cursor !== null) {
        query = query.andWhere('createdAt', '<', cursor)
      }
      const items = await query.orderBy('createdAt', 'desc').limit(limit)
      return items
    }

export const countResourceCommentsFactory =
  ({ db }: { db: Knex }) =>
    async (resourceId: string): Promise<number> => {
      const [rawCount] = await db<Comment>('comments')
        .count()
        .where({ resourceId })
      return parseInt(rawCount.count as string)
    }

export const queryCommentsFactory =
  ({ db }: { db: Knex }) =>
    async ({
      resourceId,
      limit,
      cursor
    }: {
      resourceId: string
      limit: number
      cursor: string | null
    }): Promise<Comment[]> => {
      let query = db<Comment>('comments').where({ resourceId })
      if (cursor !== null) {
        query = query.andWhere('createdAt', '<', cursor)
      }
      return await query.orderBy('createdAt', 'desc').limit(limit)
    }

export const queryRegionsFactory =
  ({ db }: { db: Knex }) =>
    async (
      params:
      | {
        connectionString?: string | undefined
      }
      | undefined = undefined
    ): Promise<Region[]> => {
      let query = db<Region>('regions')
      if (params?.connectionString !== undefined) query = query.where(params)
      return await query.select()
    }

export const findRegionFactory =
  ({ db }: { db: Knex }) =>
    async (id: string): Promise<Region | null> => {
      return (await db<Region>('regions').where({ id }).first()) ?? null
    }

export const queryOrganizationsRegionsFactory =
  ({ db }: { db: Knex }) =>
    async (): Promise<OrganizationsRegions[]> => {
      return await db<OrganizationsRegions>('organizations_regions').select()
    }

export const findOrganizationRegionFactory =
  ({ db }: { db: Knex }) =>
    async ({
      regionId,
      organizationId
    }: OrganizationsRegions): Promise<OrganizationsRegions | null> => {
      return (
        (await db<OrganizationsRegions>('organizations_regions')
          .where({ regionId, organizationId })
          .first()) ?? null
      )
    }

export const saveRegionFactory =
  ({ db }: { db: Knex }) =>
    async (region: Region): Promise<void> => {
      await db<Region>('regions').insert(region)
    }

export const saveOrganizationFactory =
  ({ db }: { db: Knex }) =>
    async (organization: Organization): Promise<void> => {
      await db<Organization>('organizations').insert(organization)
    }

export const findOrganizationFactory =
  ({ db }: { db: Knex }) =>
    async (id: string): Promise<Organization | null> => {
      return (
        (await db<Organization>('organizations').where({ id }).first()) ?? null
      )
    }

export const queryOrganizationsFactory =
  ({ db }: { db: Knex }) =>
    async (): Promise<Organization[]> => {
      return await db<Organization>('organizations').select()
    }

export const saveOrganizationRegionFactory =
  ({ db }: { db: Knex }) =>
    async (or: OrganizationsRegions): Promise<void> => {
      return await db<OrganizationsRegions>('organizations_regions').insert(or)
    }

export const saveOrganizationAclFactory =
  ({ db }: { db: Knex }) =>
    async (orgAcl: OrganizationAcl): Promise<void> => {
      await db<OrganizationsRegions>('organization_acl').insert(orgAcl)
    }

export const findOrganizationAclFactory =
  ({ db }: { db: Knex }) =>
    async ({
      userId,
      organizationId
    }: OrganizationAcl): Promise<OrganizationAcl | null> => {
      return (
        (await db<OrganizationAcl>('organization_acl')
          .where({ userId, organizationId })
          .first()) ?? null
      )
    }

export const saveOrganizationResourceAclFactory =
  ({ db }: { db: Knex }) =>
    async (item: OrganizationResourceAcl): Promise<void> => {
      await db<OrganizationResourceAcl>('organization_resource_acl').insert(item)
    }

export const findResourceRegionFactory =
  ({ db }: { db: Knex }) =>
    async ({
      resourceId
    }: {
      resourceId: string
    }): Promise<ResourceRegion | null> => {
      return (
        (await db<ResourceRegion>('resource_region')
          .where({ resourceId })
          .first()) ?? null
      )
    }

export const saveResourceRegionFactory =
  ({ db }: { db: Knex }) =>
    async (item: ResourceRegion): Promise<void> => {
      await db<ResourceRegion>('resource_region').insert(item)
    }
