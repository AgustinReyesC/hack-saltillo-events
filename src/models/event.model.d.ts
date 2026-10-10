export interface BaseEvent {
    eventId: string;
    eventType: string;
    timestamp: string;
    payload: any;
}
export type InventoryEventType = 'inspection.approved' | 'inspection.discarded' | 'inspection.rejected' | 'inspection.submitted' | 'inspection.voided' | 'location.upserted' | 'part.upserted' | 'purchase.item_received' | 'work_order.deleted' | 'work_order.opened' | 'work_order.stage_changed';
//# sourceMappingURL=event.model.d.ts.map