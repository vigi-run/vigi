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
    contacts?: ClientContact[];
    createdAt: string;
    updatedAt: string;
}

export interface ClientContact {
    id: string;
    clientId: string;
    name: string;
    email?: string;
    phone?: string;
    role?: string;
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
    contacts?: Omit<ClientContact, 'id' | 'clientId'>[];
}

export type UpdateClientDTO = Partial<CreateClientDTO> & {
    status?: ClientStatus;
};
