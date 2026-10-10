import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getGeminiApiKey } from './secrets.js';
import { downloadS3ObjectToFile } from './s3.js';
import { runAgent } from './agent.js';
import { EVENTS_JSONL_FILENAME } from './config.js';

interface S3Record {
  s3: {
    bucket: { name: string };
    object: { key: string };
  };
}

/**
 * Entry point de la Lambda.
 *
 * Modos soportados:
 *  - Evento de S3 (ObjectCreated): procesa el archivo JSONL subido y ejecuta
 *    el pipeline completo, incluida la consulta de auditoría con Gemini.
 *  - Evento programado (EventBridge Scheduler): descarga el último events.jsonl
 *    del bucket, reconstruye el estado y ejecuta la auditoría (sin llamar a IA).
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

  return {
    statusCode: 200,
    body: JSON.stringify({ status: 'ok', withAiQuery }),
  };
};
