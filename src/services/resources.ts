import cryptoRandomString from 'crypto-random-string'
import {
  Resource,
  PaginationArgs,
  ResourceCollection,
  ResourceCreateArgs,
  ResourceAcl
} from '../types'

interface GetResourcesArgs extends PaginationArgs {
  userId: string
}
export const getResourcesFactory =
  (
    countResources: (userId: string) => Promise<number>,
    queryResources: (params: GetResourcesArgs) => Promise<Resource[]>
  ) =>
    async (params: GetResourcesArgs): Promise<ResourceCollection> => {
      const totalCount = await countResources(params.userId)
      const items = await queryResources(params)
      let cursor = null
      if (items.length > 0) {
        cursor = items.slice(-1)[0].createdAt.toISOString()
      }
      return {
        totalCount,
        items,
        cursor
      }
    }

export const createResourceFactory =
  ({
    saveResource,
    saveResourceAcl
  }: {
    saveResource: (resource: Resource) => Promise<void>
    saveResourceAcl: (resourceAcl: ResourceAcl) => Promise<void>
  }) =>
    async ({ userId, name }: ResourceCreateArgs): Promise<string> => {
    // 1. if no org, create project in main region, validate that, regionId is null
    // 2. if org, validate if user has access to the org
    // 3. if org and region, validate if org has access to region
    // 4. create resource
      const id = cryptoRandomString({ length: 10 })
      const resource = { id, name, createdAt: new Date() }
      await saveResource(resource)
      await saveResourceAcl({ resourceId: id, userId })
      return id
    }
