export interface Part {
    partId: string;
    sku: string;
    name: string;
    description?: string;
    unitOfMeasure: string;
}
export interface StockAdjustment {
    partId: string;
    locationId: string;
    quantityChange: number;
    reason: string;
}
//# sourceMappingURL=inventory.model.d.ts.map