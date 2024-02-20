import { RegionRepo, MainRepo } from "./repositories";
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
  createOrganization,
  registerRegion,
  getMainRepo,
  getRegionRepo,
  getResourceRepo,
} from "./services/databaseManagement";
import { authorizeUserOrgRegion } from "./services/authz";
import cryptoRandomString from "crypto-random-string";

// Resolvers define how to fetch the types defined in your schema.
// This resolver retrieves books from the "books" array above.
export const resolvers = {
  Query: {
    async users() {
      return await getMainRepo().queryUsers();
    },
    async user(_: unknown, args: { id: string }) {
      return await getMainRepo().findUser(args.id);
    },
    async resource(
      _: unknown,
      args: { id: string; userId: string },
    ): Promise<Resource> {
      const mainRepo = getMainRepo();
      const maybeAcl = await mainRepo.getUsersResourceAcl({
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
      const resourceRepo = await getResourceRepo(args.id);
      const maybeResource = await resourceRepo.findResource(args.id);
      if (maybeResource == null) {
        throw new GraphQLError("Resource not found", {
          extensions: { code: "RESOURCE_NOT_FOUND" },
        });
      }
      return maybeResource;
    },
    async organizations() {
      return await getMainRepo().queryOrganizations();
    },
    async regions() {
      return await getMainRepo().queryRegions();
    },
  },
  User: {
    async resources(parent: UserRecord, args: PaginationArgs) {
      const mainRepo = getMainRepo();
      return await getResources(
        mainRepo.countUsersResources.bind(mainRepo),
        mainRepo.queryResources.bind(mainRepo),
      )({ userId: parent.id, ...args });
    },
  },
  Resource: {
    async comments(
      parent: Resource,
      { limit, cursor }: PaginationArgs,
    ): Promise<CommentCollection> {
      const resourceRepo = await getResourceRepo(parent.id);
      return await getComments(
        resourceRepo.countComments.bind(resourceRepo),
        resourceRepo.queryComments.bind(resourceRepo),
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
      await getMainRepo().saveUser({ id, name });
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
      await getMainRepo().saveOrganizationRegion(args);
    },
    async addUserToOrganization(
      _: unknown,
      { input: args }: { input: OrganizationAcl },
    ) {
      await getMainRepo().saveOrganizationAcl(args);
    },
    async createResource(
      _: unknown,
      { input: args }: { input: ResourceCreateArgs },
    ) {
      const mainRepo = getMainRepo();
      await authorizeUserOrgRegion(
        mainRepo.findOrganizationAcl.bind(mainRepo),
        mainRepo.findOrganizationRegion.bind(mainRepo),
      )(args);

      const repo = args.regionId
        ? await getRegionRepo({ regionId: args.regionId })
        : mainRepo;

      const resourceId = await createResource(
        repo.saveResource.bind(repo),
        mainRepo.saveResourceAcl.bind(mainRepo),
      )(args);

      if (args.organizationId) {
        await mainRepo.saveOrganizationResourceAcl({
          organizationId: args.organizationId,
          resourceId,
        });
        if (args.regionId)
          await mainRepo.saveResourceRegion({
            resourceId,
            // i know its not null here, the authz function ensures it
            regionId: args.regionId,
          });
      }
      return resourceId;
    },
    async addComment(
      _: unknown,
      { input: args }: { input: CommentCreateArgs },
    ) {
      const mainRepo = getMainRepo();
      const resourceAcl = await mainRepo.getUsersResourceAcl(args);
      if (!resourceAcl)
        throw new Error("The user doesn't have access to the given resource");
      //2. get resource db client
      const resourceRepo = await getResourceRepo(args.resourceId);
      //3. save comment to db
      const id = cryptoRandomString({ length: 10 });
      const createdAt = new Date();
      await resourceRepo.saveComment({ id, createdAt, ...args });
      return id;
    },
  },
};
