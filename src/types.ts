export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  resourceId: string;
}

export interface PaginationArgs {
  limit: number;
  cursor: string | null;
}

interface Collection<T> {
  totalCount: number;
  cursor: string | null;
  items: T[];
}

export interface CommentCollection extends Collection<Comment> {}

export interface Resource {
  id: string;
  name: string;
  createdAt: Date;
}

export interface ResourceCollection extends Collection<Resource> {}

export interface UserRecord {
  id: string;
  name: string;
}

export interface User extends UserRecord {
  resources: {
    cursor: string | null;
    totalCount: number;
    items: Resource[];
  };
}

export interface ResourceAcl {
  userId: string;
  resourceId: string;
}
