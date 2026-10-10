/**
 * Cliente mínimo de la API de inventario (hack-saltillo-api, ECS detrás del ALB).
 * API_URL es la URL base del ALB, p. ej. http://hack-saltillo-api-xxx.us-east-1.elb.amazonaws.com
 */
const TIMEOUT_MS = 8000;

function baseUrl(): string | undefined {
  return process.env.API_URL?.trim().replace(/\/+$/, '') || undefined;
}

async function getJson<T>(path: string): Promise<T | undefined> {
  const base = baseUrl();
  if (!base) return undefined;
  try {
    const res = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) {
      console.warn(`[InventoryApi] GET ${path} respondió ${res.status}`);
      return undefined;
    }
    return (await res.json()) as T;
  } catch (error) {
    console.warn(`[InventoryApi] GET ${path} falló:`, (error as Error).message);
    return undefined;
  }
}

const items = async (path: string): Promise<Record<string, unknown>[]> =>
  (await getJson<{ items: Record<string, unknown>[] }>(path))?.items ?? [];

export interface InventorySnapshot {
  parts: Record<string, unknown>[];
  shortages: Record<string, unknown>[];
  reorders: Record<string, unknown>[];
  unmatched: Record<string, unknown>[];
  workOrders: Record<string, unknown>[];
}

/** Lee de la API lo que el agente necesita para contestar (existencias, faltantes, reabasto, órdenes). */
export async function fetchSnapshot(): Promise<InventorySnapshot> {
  const [parts, shortages, reorders, unmatched, workOrders] = await Promise.all([
    items('/parts'),
    items('/shortages'),
    items('/reorder-suggestions'),
    items('/unmatched-receipts'),
    items('/work-orders'),
  ]);
  return { parts, shortages, reorders, unmatched, workOrders };
}

/** Texto compacto del estado para el prompt (sin pasar el catálogo completo). */
export function describeSnapshot(s: InventorySnapshot): string {
  const relevant = s.parts
    .filter((p) => Number(p.on_hand ?? 0) > 0 || Number(p.open_shortages ?? 0) > 0)
    .slice(0, 150)
    .map((p) => ({
      part_id: p.part_id, sku: p.sku, name: p.name, on_hand: p.on_hand,
      reserved: p.reserved, available: p.available, open_shortages: p.open_shortages,
    }));
  return JSON.stringify({
    catalog_size: s.parts.length,
    parts_with_stock_or_shortage: relevant,
    open_shortages: s.shortages.slice(0, 50),
    reorder_suggestions: s.reorders.slice(0, 50),
    unmatched_receipts: s.unmatched.slice(0, 30),
    work_orders: s.workOrders.slice(0, 30),
  });
}

/** Resumen sin IA, para cuando Gemini no responde. */
export function plainSummary(s: InventorySnapshot): string {
  const withStock = s.parts.filter((p) => Number(p.on_hand ?? 0) > 0).length;
  return (
    `Catálogo: ${s.parts.length} piezas (${withStock} con existencia). ` +
    `Faltantes abiertos: ${s.shortages.length}. Sugerencias de reabasto: ${s.reorders.length}. ` +
    `Recepciones sin relacionar: ${s.unmatched.length}. Órdenes de trabajo: ${s.workOrders.length}.`
  );
}

/** Entrega un mensaje del agente a la API (POST /agent/messages → WebSocket agent:message). */
export async function postAgentMessage(message: string, data?: Record<string, unknown>): Promise<void> {
  const base = baseUrl();
  if (!base) {
    console.warn('[InventoryApi] API_URL no está definida; no se publica el mensaje.');
    return;
  }
  try {
    const res = await fetch(`${base}/agent/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data ? { message, data } : { message }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) console.warn(`[InventoryApi] POST /agent/messages respondió ${res.status}`);
  } catch (error) {
    console.warn('[InventoryApi] POST /agent/messages falló:', (error as Error).message);
  }
}
