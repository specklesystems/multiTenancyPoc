import { queryResource, queryResourceAcl } from "./repositories";
import { getUser, getResource, getComments, getResources } from "./services";
import { GraphQLError } from "graphql";
import {
  Resource,
  ResourceCollection,
  UserRecord,
  CommentCollection,
  PaginationArgs,
} from "./types";

// Resolvers define how to fetch the types defined in your schema.
// This resolver retrieves books from the "books" array above.
export const resolvers = {
  Query: {
    async user(_: unknown, args: { id: string }, ctx) {
      return await ctx.container.cradle.queryUser(args.id);
    },
    async resource(
      _: unknown,
      args: { id: string; userId: string },
      ctx
    ): Promise<Resource> {
      const maybeAcl = await ctx.container.cradle.queryResourceAcl({
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
      const maybeResource = await ctx.container.cradle.queryResource(args.id);
      if (maybeResource == null) {
        throw new GraphQLError("Resource not found", {
          extensions: { code: "RESOURCE_NOT_FOUND" },
        });
      }
      return maybeResource;
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
      return await getComments({
        resourceId: parent.id,
        limit,
        cursor,
      });
    },
  },
};
