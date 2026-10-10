import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Resuelve el directorio que contiene los JSON Schemas.
 * Funciona tanto en local (dist/ -> ../schemas) como dentro de la imagen
 * Lambda (/var/task/dist -> /var/task/schemas), y permite override por env.
 */
export function resolveSchemaDir(): string {
  const candidates = [
    process.env.SCHEMAS_DIR,
    path.resolve(__dirname, '..', 'schemas'),
    path.resolve(__dirname, 'schemas'),
    path.resolve(process.cwd(), 'schemas'),
    path.resolve(process.cwd(), 'src', 'schemas'),
  ].filter((c): c is string => Boolean(c));

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'part.schema.json'))) {
      return candidate;
    }
  }

  return candidates[0];
}

export const EVENTS_JSONL_FILENAME = 'events.jsonl';
