import {
  queryUser,
  queryResource,
  countComments,
  queryComments,
  countResources,
  queryResources,
} from "./repositories";
import {
  UserRecord,
  Resource,
  CommentCollection,
  PaginationArgs,
  ResourceCollection,
} from "./types";

export const getUser = async (id: string): Promise<UserRecord | null> => {
  return await queryUser(id);
};

export const getResource = async (id: string): Promise<Resource | null> => {
  return await queryResource(id);
};

interface GetResourcesArgs extends PaginationArgs {
  userId: string;
}
export const getResources = async (
  params: GetResourcesArgs,
): Promise<ResourceCollection> => {
  const totalCount = await countResources(params.userId);
  const items = await queryResources(params);
  let cursor = null;
  if (items.length > 0) {
    cursor = items.slice(-1)[0].createdAt.toISOString();
  }
  return {
    totalCount,
    items,
    cursor,
  };
};

export const getComments = async (params: {
  resourceId: string;
  limit: number;
  cursor: string | null;
}): Promise<CommentCollection> => {
  // yes, i should be doing base64 de and encoding with the cursor...
  const totalCount = await countComments(params.resourceId);
  const items = await queryComments(params);
  let cursor = null;
  if (items.length > 0) {
    cursor = items.slice(-1)[0].createdAt.toISOString();
  }
  return {
    totalCount,
    items,
    cursor,
  };
};
