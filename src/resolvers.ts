import { getCommentsFactory } from "./services/comments";
import {
  createResourceFactory,
  getResourcesFactory,
} from "./services/resources";
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
  createOrganization,
  registerRegion,
  getResourceDb,
  getMainDbClient,
  getRegionDb,
} from "./services/databaseManagement";
import { authorizeUserOrgRegionFactory } from "./services/authz";
import cryptoRandomString from "crypto-random-string";
import {
  countCommentsFactory,
  countUsersResourcesFactory,
  findOrganizationAclFactory,
  findOrganizationRegionFactory,
  findResourceFactory,
  findUserFactory,
  getUsersResourceAclFactory,
  queryCommentsFactory,
  queryOrganizationsFactory,
  queryRegionsFactory,
  queryResourcesFactory,
  queryUsersFactoy,
  saveCommentFactory,
  saveOrganizationAclFactory,
  saveOrganizationRegionFactory,
  saveOrganizationResourceAclFactory,
  saveResourceAclFactory,
  saveResourceFactory,
  saveResourceRegionFactory,
  saveUserFactory,
} from "./repositories";

const db = getMainDbClient();
// Resolvers define how to fetch the types defined in your schema.
// This resolver retrieves books from the "books" array above.
export const resolvers = {
  Query: {
    async users() {
      return await queryUsersFactoy({ db })();
    },
    async user(_: unknown, args: { id: string }) {
      return await findUserFactory({ db })(args.id);
    },
    async resource(
      _: unknown,
      args: { id: string; userId: string },
    ): Promise<Resource> {
      const maybeAcl = await getUsersResourceAclFactory({ db })({
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
      const resourceDb = await getResourceDb(args.id);
      const maybeResource = await findResourceFactory({ db: resourceDb })(
        args.id,
      );
      if (maybeResource == null) {
        throw new GraphQLError("Resource not found", {
          extensions: { code: "RESOURCE_NOT_FOUND" },
        });
      }
      return maybeResource;
    },
    async organizations() {
      return await queryOrganizationsFactory({ db })();
    },
    async regions() {
      return await queryRegionsFactory({ db })();
    },
  },
  User: {
    async resources(parent: UserRecord, args: PaginationArgs) {
      return await getResourcesFactory(
        countUsersResourcesFactory({ db }),
        queryResourcesFactory({ db }),
      )({ userId: parent.id, ...args });
    },
  },
  Resource: {
    async comments(
      parent: Resource,
      { limit, cursor }: PaginationArgs,
    ): Promise<CommentCollection> {
      const resourceDb = await getResourceDb(parent.id);
      return await getCommentsFactory(
        countCommentsFactory({ db: resourceDb }),
        queryCommentsFactory({ db: resourceDb }),
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
      await saveUserFactory({ db })({ id, name });
      return id;
    },
    async registerRegion(
      _: unknown,
      args: {
        name: string;
        connectionString: string;
        sslCaCert: string | null;
      },
    ) {
      return await registerRegion(args);
    },
    async createOrganization(_: unknown, args: { name: string }) {
      return await createOrganization(args.name);
    },
    async addRegionToOrganization(_: unknown, args: OrganizationsRegions) {
      await saveOrganizationRegionFactory({ db })(args);
    },
    async addUserToOrganization(
      _: unknown,
      { input: args }: { input: OrganizationAcl },
    ) {
      await saveOrganizationAclFactory({ db })(args);
    },
    async createResource(
      _: unknown,
      { input: args }: { input: ResourceCreateArgs },
    ) {
      await authorizeUserOrgRegionFactory(
        findOrganizationAclFactory({ db }),
        findOrganizationRegionFactory({ db }),
      )(args);

      const resourceDb =
        args.regionId !== null
          ? await getRegionDb({ regionId: args.regionId })
          : db;

      const resourceId = await createResourceFactory(
        saveResourceFactory({ db: resourceDb }),
        saveResourceAclFactory({ db }),
      )(args);

      if (args.organizationId !== null) {
        await saveOrganizationResourceAclFactory({ db })({
          organizationId: args.organizationId,
          resourceId,
        });
        if (args.regionId !== null) {
          await saveResourceRegionFactory({ db })({
            resourceId,
            // i know its not null here, the authz function ensures it
            regionId: args.regionId,
          });
        }
      }
      return resourceId;
    },
    async addComment(
      _: unknown,
      { input: args }: { input: CommentCreateArgs },
    ) {
      const resourceAcl = await getUsersResourceAclFactory({ db })(args);
      if (resourceAcl == null) {
        throw new Error("The user doesn't have access to the given resource");
      }
      // 2. get resource db client
      const resourceDb = await getResourceDb(args.resourceId);
      // 3. save comment to db
      const id = cryptoRandomString({ length: 10 });
      const createdAt = new Date();
      await saveCommentFactory({ db: resourceDb })({ id, createdAt, ...args });
      return id;
    },
  },
};
