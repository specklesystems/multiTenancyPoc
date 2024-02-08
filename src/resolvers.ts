import {
  getOrganizationsFrom,
  getRegionsFrom,
  queryOrganizationAclFrom,
  queryOrganizationRegionsFrom,
  queryResourceAclFrom,
  saveOrganizationResourceAclTo,
  saveOrganizationAclTo,
  saveResourceAclTo,
  saveResourceTo,
  saveResourceRegionOrganizationTo,
  saveCommentTo,
  queryResourceFrom,
  queryUser,
  countCommentsIn,
  queryCommentsFrom,
  getUsersFrom,
  saveUserTo,
} from "./repositories";
import { getComments } from "./services/comments";
import { createResource, getResources } from "./services/resources";
import { GraphQLError } from "graphql";
import {
  Resource,
  UserRecord,
  CommentCollection,
  PaginationArgs,
  ResourceCreateArgs,
  OrganizationsRegions,
  OrganizationAcl,
  CommentCreateArgs,
  UserCreateArgs,
} from "./types";
import {
  bindRegionToOrganization,
  createOrganization,
  getDbClient,
  getMainDbClient,
  getResourceDatabaseConnection,
  registerRegion,
} from "./services/databaseManagement";
import { authorizeUserOrgRegion } from "./services/authz";
import cryptoRandomString from "crypto-random-string";

// Resolvers define how to fetch the types defined in your schema.
// This resolver retrieves books from the "books" array above.
export const resolvers = {
  Query: {
    async users() {
      return await getUsersFrom(getMainDbClient())();
    },
    async user(_: unknown, args: { id: string }) {
      return await queryUser(args.id);
    },
    async resource(
      _: unknown,
      args: { id: string; userId: string },
    ): Promise<Resource> {
      const mainDb = getMainDbClient();
      const maybeAcl = await queryResourceAclFrom(mainDb)({
        userId: args.userId,
        resourceId: args.id,
      });
      if (maybeAcl == null) {
        throw new GraphQLError(
          "The user doesn't have access to the given resource",
          {
            extensions: {
              code: "FORBIDDEN",
            },
          },
        );
      }
      const db = await getResourceDatabaseConnection(args.id);
      const maybeResource = await queryResourceFrom(db)(args.id);
      if (maybeResource == null) {
        throw new GraphQLError("Resource not found", {
          extensions: { code: "RESOURCE_NOT_FOUND" },
        });
      }
      return maybeResource;
    },
    async organizations() {
      return await getOrganizationsFrom(getMainDbClient())();
    },
    async regions() {
      return await getRegionsFrom(getMainDbClient())();
    },
  },
  User: {
    async resources(parent: UserRecord, args: PaginationArgs) {
      return await getResources({ userId: parent.id, ...args });
    },
  },
  Resource: {
    async comments(
      parent: Resource,
      { limit, cursor }: PaginationArgs,
    ): Promise<CommentCollection> {
      const db = await getResourceDatabaseConnection(parent.id);
      return await getComments(
        countCommentsIn(db),
        queryCommentsFrom(db),
      )({
        resourceId: parent.id,
        limit,
        cursor,
      });
    },
  },
  Mutation: {
    async createUser(
      _: unknown,
      { input: { name } }: { input: UserCreateArgs },
    ) {
      const id = cryptoRandomString({ length: 10 });
      await saveUserTo(getMainDbClient())({ id, name });
      return id;
    },
    async registerRegion(
      _: unknown,
      args: {
        name: string;
        connectionString: string;
        maintenanceDb: string;
      },
    ) {
      return await registerRegion(args);
    },
    async createOrganization(_: unknown, args: { name: string }) {
      return await createOrganization(args.name);
    },
    async addRegionToOrganization(_: unknown, args: OrganizationsRegions) {
      await bindRegionToOrganization(args);
    },
    async addUserToOrganization(
      _: unknown,
      { input: args }: { input: OrganizationAcl },
    ) {
      await saveOrganizationAclTo(getMainDbClient())(args);
    },
    async createResource(
      _: unknown,
      { input: args }: { input: ResourceCreateArgs },
    ) {
      const mainDb = getMainDbClient();
      await authorizeUserOrgRegion(
        queryOrganizationAclFrom(mainDb),
        queryOrganizationRegionsFrom(mainDb),
      )(args);

      const db =
        args.regionId && args.organizationId
          ? await getDbClient({
              regionId: args.regionId,
              organizationId: args.organizationId,
            })
          : mainDb;

      const resourceId = await createResource(
        saveResourceTo(db),
        saveResourceAclTo(mainDb),
      )(args);

      if (args.organizationId) {
        await saveOrganizationResourceAclTo(mainDb)({
          organizationId: args.organizationId,
          resourceId,
        });
        await saveResourceRegionOrganizationTo(mainDb)({
          resourceId,
          organizationId: args.organizationId,
          // i know its not null here, the authz function ensures it
          regionId: args.regionId!,
        });
      }
      return resourceId;
    },
    async addComment(
      _: unknown,
      { input: args }: { input: CommentCreateArgs },
    ) {
      const mainDb = getMainDbClient();
      const resourceAcl = await queryResourceAclFrom(mainDb)(args);
      if (!resourceAcl)
        throw new Error("The user doesn't have access to the given resource");
      //2. get resource db client
      const db = await getResourceDatabaseConnection(args.resourceId);
      //3. save comment to db
      const id = cryptoRandomString({ length: 10 });
      const createdAt = new Date();
      await saveCommentTo(db)({ id, createdAt, ...args });
      return id;
    },
  },
};
