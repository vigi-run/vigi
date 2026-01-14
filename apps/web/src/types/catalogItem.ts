export enum CatalogItemType {
    PRODUCT = 'PRODUCT',
    SERVICE = 'SERVICE',
}

export const CatalogItemUnits = [
    "UN",
    "KG",
    "G",
    "L",
    "ML",
    "M",
    "M2",
    "M3",
    "H",
    "D",
] as const;

export type CatalogItemUnit = (typeof CatalogItemUnits)[number];

export interface CatalogItem {
    id: string;
    organizationId: string;
    type: CatalogItemType;
    name: string;
    productKey: string; // SKU
    notes: string;
    price: number;
    cost: number;
    unit: string;
    ncmNbs: string;
    taxRate: number;

    inStockQuantity?: number;
    stockNotification?: boolean;
    stockThreshold?: number;

    createdAt: string;
    updatedAt: string;
}

export interface CreateCatalogItemDTO {
    type: CatalogItemType;
    name: string;
    productKey: string;
    notes?: string;
    price: number;
    cost: number;
    unit: string;
    ncmNbs?: string;
    taxRate: number;

    inStockQuantity?: number;
    stockNotification?: boolean;
    stockThreshold?: number;
}

export interface UpdateCatalogItemDTO {
    type?: CatalogItemType;
    name?: string;
    productKey?: string;
    notes?: string;
    price?: number;
    cost?: number;
    unit?: string;
    ncmNbs?: string;
    taxRate?: number;

    inStockQuantity?: number;
    stockNotification?: boolean;
    stockThreshold?: number;
}

export interface CatalogItemFilter {
    page?: number;
    limit?: number;
    q?: string;
    type?: CatalogItemType;
}
