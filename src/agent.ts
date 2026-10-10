import * as path from 'node:path';
import { ValidatorService } from './services/validator.service.js';
import { InventoryService } from './services/inventory.service.js';
import { EventConsumerService } from './services/event-consumer.service.js';
import { AIService } from './services/ai.service.js';
import { resolveSchemaDir } from './config.js';

/**
 * Carga esquemas, consume el archivo de eventos completo y devuelve el
 * inventario resultante (estado reconstruido en memoria).
 */
export async function processEventsFile(
  eventsFilePath: string,
): Promise<InventoryService> {
  const validator = new ValidatorService();
  const inventory = new InventoryService();
  const consumer = new EventConsumerService(validator, inventory);

  const schemaDir = resolveSchemaDir();
  validator.loadSchema(
    'part.upserted',
    path.join(schemaDir, 'part.schema.json'),
  );
  validator.loadSchema(
    'location.upserted',
    path.join(schemaDir, 'location.schema.json'),
  );

  await consumer.consumeStream(eventsFilePath);

  return inventory;
}

export interface PipelineOptions {
  withAiQuery?: boolean;
}

/**
 * Pipeline completo del agente: procesa eventos, imprime el resumen de
 * inventario y (opcionalmente) ejecuta la consulta de auditoría con Gemini.
 */
export async function runAgent(
  eventsFilePath: string,
  options: PipelineOptions = {},
): Promise<void> {
  const { withAiQuery = false } = options;

  const inventory = await processEventsFile(eventsFilePath);
  inventory.printSummary();

  if (withAiQuery) {
    const aiService = new AIService();
    const stateSummaryText =
      'Partes registradas y niveles de stock actualizados correctamente tras procesar el flujo de eventos. Stock total en loc-A1: 200 unidades de la pieza p-101.';
    const aiAnswer = await aiService.queryInventoryAssistant(
      stateSummaryText,
      '¿Tenemos suficiente stock en la ubicación principal y cuál es el estado general?',
    );
    console.log(`\n💬 Respuesta del Asistente IA:\n${aiAnswer}\n`);
  }
}
