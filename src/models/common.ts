export interface BaseEvent<T = any> {
  eventId: string;
  eventType: string;
  timestamp: string;
  payload: T;
}