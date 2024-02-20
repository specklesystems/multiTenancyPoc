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
  ResourceRegion,
} from './types'

export class RegionRepo {
  db: Knex

  constructor(db: Knex) {
    this.db = db
  }

  async saveResource(resource: Resource): Promise<void> {
    await this.db<Resource>('resources').insert(resource)
  }

  async findResource(resourceId: string): Promise<Resource | null> {
    return (
      (await this.db<Resource>('resources')
        .where({ id: resourceId })
        .first()) ?? null
    )
  }

  async saveComment(comment: Comment): Promise<void> {
    await this.db<Comment>('comments').insert(comment)
  }

  async countComments(resourceId: string): Promise<number> {
    const [rawCount] = await this.db<Comment>('comments')
      .count()
      .where({ resourceId })
    return parseInt(rawCount.count as string)
  }

  async queryComments({
    resourceId,
    limit,
    cursor,
  }: {
    resourceId: string
    limit: number
    cursor: string | null
  }): Promise<Comment[]> {
    const query = this.db<Comment>('comments').where({ resourceId })
    if (cursor) {
      query.andWhere('createdAt', '<', cursor)
    }
    return await query.limit(limit)
  }
}

export class MainRepo extends RegionRepo {
  async findUser(userId: string): Promise<UserRecord | null> {
    return (
      (await this.db<UserRecord>('users').where('id', '=', userId).first()) ??
      null
    )
  }

  async queryUsers(): Promise<UserRecord[]> {
    return await this.db<UserRecord>('users').select()
  }

  async saveUser(user: UserRecord): Promise<void> {
    await this.db<UserRecord>('users').insert(user)
  }

  async getUsersResourceAcl({
    resourceId,
    userId,
  }: ResourceAcl): Promise<ResourceAcl | null> {
    return (
      (await this.db<ResourceAcl>('resource_acl')
        .where({ userId, resourceId })
        .first()) ?? null
    )
  }

  async saveResourceAcl(resourceAcl: ResourceAcl): Promise<void> {
    await this.db<ResourceAcl>('resource_acl').insert(resourceAcl)
  }

  async countUsersResources(userId: string): Promise<number> {
    const [rawCount] = await this.db<ResourceAcl>('resource_acl')
      .count()
      .where({ userId })
    return parseInt(rawCount.count as string)
  }

  async findUsersResource({
    resourceId,
    userId,
  }: ResourceAcl): Promise<ResourceAcl | null> {
    return (
      (await this.db<ResourceAcl>('resource_acl')
        .where({ userId, resourceId })
        .first()) ?? null
    )
  }

  async queryResources({
    userId,
    limit,
    cursor,
  }: {
    userId: string
    limit: number
    cursor: string | null
  }): Promise<Resource[]> {
    let query = this.db<Resource & ResourceAcl>('resources')
      .join('resource_acl', 'resources.id', 'resource_acl.resourceId')
      .where({ userId })
    if (cursor) {
      query = query.andWhere('createdAt', '<', cursor)
    }
    const items = await query.orderBy('createdAt', 'desc').limit(limit)
    return items
  }

  async countResourceComments(resourceId: string): Promise<number> {
    const [rawCount] = await this.db<Comment>('comments')
      .count()
      .where({ resourceId })
    return parseInt(rawCount.count as string)
  }

  async queryComments({
    resourceId,
    limit,
    cursor,
  }: {
    resourceId: string
    limit: number
    cursor: string | null
  }): Promise<Comment[]> {
    let query = this.db<Comment>('comments').where({ resourceId })
    if (cursor) {
      query = query.andWhere('createdAt', '<', cursor)
    }
    return await query.orderBy('createdAt', 'desc').limit(limit)
  }

  async queryRegions(
    params:
      | {
          connectionString?: string | undefined
        }
      | undefined = undefined,
  ): Promise<Array<Region>> {
    const query = this.db<Region>('regions')
    if (params && params.connectionString) query.where(params)
    return await query.select()
  }

  async findRegion(id: string): Promise<Region | null> {
    return (await this.db<Region>('regions').where({ id }).first()) ?? null
  }

  async queryOrganizationsRegions(): Promise<Array<OrganizationsRegions>> {
    return await this.db<OrganizationsRegions>('organizations_regions').select()
  }
  async findOrganizationRegion({
    regionId,
    organizationId,
  }: OrganizationsRegions): Promise<OrganizationsRegions | null> {
    return (
      (await this.db<OrganizationsRegions>('organizations_regions')
        .where({ regionId, organizationId })
        .first()) ?? null
    )
  }

  async saveRegion(region: Region): Promise<void> {
    await this.db<Region>('regions').insert(region)
  }
  async saveOrganization(organization: Organization) {
    await this.db<Organization>('organizations').insert(organization)
  }
  async findOrganization(id: string): Promise<Organization | null> {
    return (
      (await this.db<Organization>('organizations').where({ id }).first()) ??
      null
    )
  }

  async queryOrganizations(): Promise<Organization[]> {
    return await this.db<Organization>('organizations').select()
  }

  async saveOrganizationRegion(or: OrganizationsRegions): Promise<void> {
    return await this.db<OrganizationsRegions>('organizations_regions').insert(
      or,
    )
  }

  async saveOrganizationAcl(orgAcl: OrganizationAcl): Promise<void> {
    await this.db<OrganizationsRegions>('organization_acl').insert(orgAcl)
  }

  async findOrganizationAcl({
    userId,
    organizationId,
  }: OrganizationAcl): Promise<OrganizationAcl | null> {
    return (
      (await this.db<OrganizationAcl>('organization_acl')
        .where({ userId, organizationId })
        .first()) ?? null
    )
  }

  async saveOrganizationResourceAcl(
    item: OrganizationResourceAcl,
  ): Promise<void> {
    await this.db<OrganizationResourceAcl>('organization_resource_acl').insert(
      item,
    )
  }

  async findResourceRegion({
    resourceId,
  }: {
    resourceId: string
  }): Promise<ResourceRegion | null> {
    return (
      (await this.db<ResourceRegion>('resource_region')
        .where({ resourceId })
        .first()) ?? null
    )
  }

  async saveResourceRegion(item: ResourceRegion): Promise<void> {
    await this.db<ResourceRegion>('resource_region').insert(item)
  }
}
