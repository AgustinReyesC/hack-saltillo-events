export interface PartUpsertedPayload {
    partId: string;
    sku: string;
    name: string;
    description?: string;
    unitOfMeasure: string;
}
export interface LocationUpsertedPayload {
    locationId: string;
    name: string;
    type: string;
    active: boolean;
}
export type InspectionStatus = 'submitted' | 'approved' | 'rejected' | 'discarded' | 'voided';
export interface InspectionPayload {
    inspectionId: string;
    partId: string;
    locationId: string;
    quantity: number;
    inspectorId: string;
    notes?: string;
    timestamp?: string;
}
export interface PurchaseItemReceivedPayload {
    purchaseOrderId: string;
    itemId: string;
    partId: string;
    locationId: string;
    quantityReceived: number;
    receivedBy: string;
}
export interface WorkOrderOpenedPayload {
    workOrderId: string;
    equipmentId?: string;
    priority: string;
    requestedBy: string;
}
export interface WorkOrderStageChangedPayload {
    workOrderId: string;
    previousStage: string;
    currentStage: string;
    changedBy: string;
}
export interface WorkOrderDeletedPayload {
    workOrderId: string;
    reason: string;
}
//# sourceMappingURL=inputs.d.ts.map