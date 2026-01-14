import { z } from "zod";
import { CatalogItemType, CatalogItemUnits } from "@/types/catalogItem";

export const getCatalogItemSchema = (t: (key: string) => string) => {
    const baseSchema = z.object({
        type: z.nativeEnum(CatalogItemType),
        name: z.string().min(1, t("catalog_item.validation.name_required")),
        productKey: z.string().min(1, t("catalog_item.validation.product_key_required")),
        notes: z.string().optional(),
        price: z.number().min(0),
        cost: z.number().min(0),
        unit: z.enum(CatalogItemUnits as unknown as [string, ...string[]], {
            errorMap: () => ({ message: t("catalog_item.validation.unit_required") }),
        }),
        ncmNbs: z.string().optional(),
        taxRate: z.number().min(0),
    });

    const productSchema = baseSchema.extend({
        type: z.literal(CatalogItemType.PRODUCT),
        inStockQuantity: z.number().optional(),
        stockNotification: z.boolean().optional(),
        stockThreshold: z.number().optional(),
    });

    const serviceSchema = baseSchema.extend({
        type: z.literal(CatalogItemType.SERVICE),
        inStockQuantity: z.null().optional(),
        stockNotification: z.null().optional(),
        stockThreshold: z.null().optional(),
    });

    return z.discriminatedUnion("type", [
        productSchema,
        serviceSchema,
    ]);
};

export type CatalogItemFormValues = z.infer<ReturnType<typeof getCatalogItemSchema>>;
