export interface CommentCreateArgs {
  userId: string;
  content: string;
  resourceId: string;
}

export interface Comment extends CommentCreateArgs {
  id: string;
  createdAt: Date;
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

export interface UserOrgRegionArgs {
  userId: string;
  organizationId: string | null;
  regionId: string | null;
}

export interface ResourceCreateArgs extends UserOrgRegionArgs {
  name: string;
}

export interface Resource {
  id: string;
  name: string;
  createdAt: Date;
}

export interface ResourceCollection extends Collection<Resource> {}

export interface UserCreateArgs {
  name: string;
}

export interface UserRecord extends UserCreateArgs {
  id: string;
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

export interface Region {
  id: string;
  name: string;
  connectionString: string;
  maintenanceDb: string;
}

export interface Organization {
  id: string;
  name: string;
}

export interface OrganizationAcl {
  userId: string;
  organizationId: string;
}

export interface OrganizationsRegions {
  organizationId: string;
  regionId: string;
}

export interface OrganizationResourceAcl {
  organizationId: string;
  resourceId: string;
}

export interface ResourceRegion {
  resourceId: string;
  regionId: string;
}

export interface ResourceRegionOrg extends ResourceRegion {
  organizationId: string;
}
