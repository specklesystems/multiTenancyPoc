import { CommentCollection, PaginationArgs, Comment } from '../types'

interface GetCommentsArgs extends PaginationArgs {
  resourceId: string
}

export const getComments =
  (
    countComments: (resourceId: string) => Promise<number>,
    queryComments: (params: GetCommentsArgs) => Promise<Comment[]>
  ) =>
    async (params: GetCommentsArgs): Promise<CommentCollection> => {
    // yes, i should be doing base64 de and encoding with the cursor...
      const totalCount = await countComments(params.resourceId)
      const items = await queryComments(params)
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
