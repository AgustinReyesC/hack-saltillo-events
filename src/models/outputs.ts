export interface StockReceivedPayload {
  stockId: string;
  partId: string;
  locationId: string;
  quantity: number;
  referenceId: string;
}

export interface StockIssuedPayload {
  stockId: string;
  partId: string;
  locationId: string;
  quantity: number;
  issuedTo: string;
}

export interface StockAdjustedPayload {
  stockId: string;
  partId: string;
  locationId: string;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
}

export interface StockTransferredPayload {
  transferId: string;
  partId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  quantity: number;
}

export interface StockReservedPayload {
  reservationId: string;
  partId: string;
  locationId: string;
  quantity: number;
  referenceId: string;
}

export interface StockShortageDetectedPayload {
  partId: string;
  locationId: string;
  requiredQuantity: number;
  availableQuantity: number;
}

export interface StockShortageResolvedPayload {
  shortageId: string;
  partId: string;
  locationId: string;
}

export interface StockReorderSuggestedPayload {
  partId: string;
  locationId: string;
  currentStock: number;
  reorderPoint: number;
  suggestedQuantity: number;
}

export interface UnmatchedReceiptPayload {
  receiptId: string;
  details: Record<string, any>;
  reason: string;
}