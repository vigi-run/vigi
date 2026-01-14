export type ClientClassification = 'individual' | 'company';
export type ClientStatus = 'active' | 'inactive' | 'blocked';

export interface Client {
    id: string;
    organizationId: string;
    name: string;
    idNumber?: string;
    vatNumber?: string;
    address1?: string;
    addressNumber?: string;
    address2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    customValue1?: number;
    classification: ClientClassification;
    status: ClientStatus;
    createdAt: string;
    updatedAt: string;
}

export interface CreateClientDTO {
    name: string;
    idNumber?: string;
    vatNumber?: string;
    address1?: string;
    addressNumber?: string;
    address2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    customValue1?: number;
    classification: ClientClassification;
}

export type UpdateClientDTO = Partial<CreateClientDTO> & {
    status?: ClientStatus;
};
