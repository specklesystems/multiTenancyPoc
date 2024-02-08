import {
  OrganizationAcl,
  OrganizationsRegions,
  UserOrgRegionArgs,
} from "../types";

export const authorizeUserOrgRegion =
  (
    orgAclGetter: (params: OrganizationAcl) => Promise<OrganizationAcl | null>,
    orgRegionGetter: (
      params: OrganizationsRegions,
    ) => Promise<OrganizationsRegions | null>,
  ) =>
  async ({ userId, regionId, organizationId }: UserOrgRegionArgs) => {
    if (!organizationId && regionId)
      throw new Error("public org doesn't support regions");
    if (organizationId) {
      if (!regionId) throw new Error("organizations can only write to regions");
      const orgAcl = await orgAclGetter({ organizationId, userId });
      if (!orgAcl)
        throw new Error("user doesn't have access to this organization");
      const orgRegion = await orgRegionGetter({ organizationId, regionId });
      if (!orgRegion)
        throw new Error("organization doesnt have access to this region");
    }
  };
