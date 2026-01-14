import { client } from "./client.gen";
import type { BackofficeStatsDto, BackofficeUserListDto, BackofficeOrgListDto, BackofficeOrgDetailDto } from "./types.gen";

export const getBackofficeStats = () => {
    return client.get<BackofficeStatsDto>({ url: '/backoffice/stats' });
};

export const getBackofficeUsers = () => {
    return client.get<BackofficeUserListDto[]>({ url: '/backoffice/users' });
};

export const getBackofficeOrgs = () => {
    return client.get<BackofficeOrgListDto[]>({ url: '/backoffice/organizations' });
};

export const getBackofficeOrg = (id: string) => {
    return client.get<BackofficeOrgDetailDto>({ url: `/backoffice/organizations/${id}` });
};
