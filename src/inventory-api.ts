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

const items = async (path: string): Promise<Record<string, unknown>[] | undefined> =>
  (await getJson<{ items: Record<string, unknown>[] }>(path))?.items;

export interface InventorySnapshot {
  parts: Record<string, unknown>[];
  shortages: Record<string, unknown>[];
  reorders: Record<string, unknown>[];
  unmatched: Record<string, unknown>[];
  workOrders: Record<string, unknown>[];
  // Secciones que la API no devolvió (timeout o error): no son "0", son desconocidas.
  unavailable: string[];
}

/** Lee de la API lo que el agente necesita para contestar (existencias, faltantes, reabasto, órdenes). */
export async function fetchSnapshot(): Promise<InventorySnapshot> {
  const sections = {
    parts: '/parts',
    shortages: '/shortages',
    reorders: '/reorder-suggestions',
    unmatched: '/unmatched-receipts',
    workOrders: '/work-orders',
  } as const;
  const names = Object.keys(sections) as (keyof typeof sections)[];
  const results = await Promise.all(names.map((name) => items(sections[name])));
  const snapshot = { unavailable: [] as string[] } as InventorySnapshot;
  names.forEach((name, index) => {
    snapshot[name] = results[index] ?? [];
    if (!results[index]) snapshot.unavailable.push(name);
  });
  return snapshot;
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
    sections_not_available: s.unavailable,
  });
}

/** Resumen sin IA, para cuando Gemini no responde. */
export function plainSummary(s: InventorySnapshot): string {
  const count = (name: keyof InventorySnapshot, list: unknown[]) =>
    s.unavailable.includes(name) ? 'sin datos (la API no respondió)' : String(list.length);
  const withStock = s.parts.filter((p) => Number(p.on_hand ?? 0) > 0).length;
  const catalog = s.unavailable.includes('parts')
    ? 'sin datos (la API no respondió)'
    : `${s.parts.length} piezas (${withStock} con existencia)`;
  return (
    `Catálogo: ${catalog}. ` +
    `Faltantes abiertos: ${count('shortages', s.shortages)}. Sugerencias de reabasto: ${count('reorders', s.reorders)}. ` +
    `Recepciones sin relacionar: ${count('unmatched', s.unmatched)}. Órdenes de trabajo: ${count('workOrders', s.workOrders)}.`
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
