import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getGeminiApiKey } from './secrets.js';
import { downloadS3ObjectToFile } from './s3.js';
import { runAgent } from './agent.js';
import { EVENTS_JSONL_FILENAME } from './config.js';
import { AIService } from './services/ai.service.js';
import {
  describeSnapshot,
  fetchSnapshot,
  plainSummary,
  postAgentMessage,
} from './inventory-api.js';

interface S3Record {
  s3: {
    bucket: { name: string };
    object: { key: string };
  };
}

const AI_ERROR = 'Error al consultar el asistente de IA.';

/**
 * Contesta una pregunta con el estado real del inventario (leído de la API).
 * Si Gemini no responde (p. ej. 503 por demanda), reintenta una vez y si no
 * devuelve un resumen sin IA.
 */
async function answerQuestion(question: string): Promise<string> {
  const snapshot = await fetchSnapshot();
  const ai = new AIService();
  for (let attempt = 0; attempt < 2; attempt++) {
    const answer = await ai.queryInventoryAssistant(describeSnapshot(snapshot), question);
    if (answer && answer !== AI_ERROR) return answer;
  }
  return `No pude consultar la IA en este momento. Estado actual: ${plainSummary(snapshot)}`;
}

/** Texto de la pregunta dentro de un sobre de `notifications`. */
function questionFrom(event: any): string {
  const data = event?.data ?? {};
  const text = data.message ?? data.text ?? data.question;
  return typeof text === 'string' && text.trim() ? text : JSON.stringify(data);
}

/**
 * Entry point de la Lambda.
 *
 * Modos soportados:
 *  - `{action: "chat", message}` (lo invoca la API en POST /chat): devuelve `{answer}`.
 *  - `{action: "notification", event}` (lo invoca la API por cada evento de la
 *    cola `notifications`): contesta por POST /agent/messages de la API.
 *  - Evento de S3 (ObjectCreated): procesa el archivo JSONL subido y ejecuta
 *    el pipeline completo, incluida la consulta de auditoría con Gemini.
 *  - Evento programado (EventBridge Scheduler): descarga el último events.jsonl
 *    del bucket, reconstruye el estado, ejecuta la auditoría (sin llamar a IA) y
 *    publica en la API un resumen del inventario real.
 */
export const handler = async (event: any) => {
  const apiKey = await getGeminiApiKey();
  if (apiKey) {
    process.env.GEMINI_API_KEY = apiKey;
  } else {
    console.warn(
      '[Handler] No se encontró GEMINI_API_KEY (ni env ni Secrets Manager).',
    );
  }

  if (event?.action === 'chat') {
    const message = String(event.message ?? '').trim();
    console.log(`[Handler] Chat: ${message.slice(0, 200)}`);
    return { answer: message ? await answerQuestion(message) : '¿Qué quieres consultar del inventario?' };
  }

  if (event?.action === 'notification') {
    const envelope = event.event;
    console.log(`[Handler] Notificación ${envelope?.event_type} (${envelope?.event_id})`);
    const answer = await answerQuestion(questionFrom(envelope));
    await postAgentMessage(answer, { event_id: envelope?.event_id, key: envelope?.key });
    return { status: 'ok' };
  }

  const s3Record: S3Record | undefined = event?.Records?.find(
    (record: any) => record?.s3,
  );

  const localFilePath = join(tmpdir(), EVENTS_JSONL_FILENAME);
  let withAiQuery = true;

  if (s3Record) {
    const bucket = s3Record.s3.bucket.name;
    const key = decodeURIComponent(
      s3Record.s3.object.key.replace(/\+/g, ' '),
    );
    console.log(
      `[Handler] Evento S3 detectado: s3://${bucket}/${key}`,
    );
    await downloadS3ObjectToFile(bucket, key, localFilePath);
  } else {
    withAiQuery = false;
    const bucket = process.env.EVENTS_BUCKET;
    const key = process.env.EVENTS_KEY ?? EVENTS_JSONL_FILENAME;

    if (!bucket) {
      throw new Error(
        '[Handler] EVENTS_BUCKET no está definido para el modo programado.',
      );
    }

    console.log(
      `[Handler] Ejecución programada (auditoría): s3://${bucket}/${key}`,
    );
    await downloadS3ObjectToFile(bucket, key, localFilePath);
  }

  await runAgent(localFilePath, { withAiQuery });

  if (!s3Record) {
    const snapshot = await fetchSnapshot();
    await postAgentMessage(`Auditoría programada. ${plainSummary(snapshot)}`, {
      shortages: snapshot.shortages.length,
      reorder_suggestions: snapshot.reorders.length,
      unmatched_receipts: snapshot.unmatched.length,
    });
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ status: 'ok', withAiQuery }),
  };
};
