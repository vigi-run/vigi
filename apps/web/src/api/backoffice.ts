import { client } from "./client.gen";
import type { BackofficeStatsDto, BackofficeUserListDto, BackofficeOrgListDto, BackofficeOrgDetailDto } from "./types.gen";

export const getBackofficeStats = () => {
  return client.get<{ 200: BackofficeStatsDto }>({ url: '/backoffice/stats' });
};

export const getBackofficeUsers = () => {
  return client.get<{ 200: BackofficeUserListDto[] }>({ url: '/backoffice/users' });
};

export const getBackofficeOrgs = () => {
  return client.get<{ 200: BackofficeOrgListDto[] }>({ url: '/backoffice/organizations' });
};

export const getBackofficeOrg = (id: string) => {
  return client.get<{ 200: BackofficeOrgDetailDto }>({ url: `/backoffice/organizations/${id}` });
};
