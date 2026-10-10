import * as path from 'path';
import { fileURLToPath } from 'url';
import { ValidatorService } from './services/validator.service.js';
import { InventoryService } from './services/inventory.service.js';
import { EventConsumerService } from './services/event-consumer.service.js';
import { SchedulerService } from './services/scheduler.service.js';
import { AIService } from './services/ai.service.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function main() {
    console.log('🚀 Iniciando Agente de Inventario Inteligente (Arquitectura Completa)...');
    const validator = new ValidatorService();
    const inventory = new InventoryService();
    const consumer = new EventConsumerService(validator, inventory);
    const scheduler = new SchedulerService(inventory, 10);
    const aiService = new AIService();
    // 1. Cargar esquemas de validación necesarios
    validator.loadSchema('part.upserted', path.resolve(__dirname, '../schemas/part.schema.json'));
    validator.loadSchema('location.upserted', path.resolve(__dirname, '../schemas/location.schema.json'));
    const eventsFilePath = path.resolve(__dirname, '../data/events.jsonl');
    console.log(`📂 Consumiendo eventos desde el stream: ${eventsFilePath}\n`);
    // 2. Ejecutar el consumidor de eventos en streaming
    await consumer.consumeStream(eventsFilePath);
    // 3. Imprimir resumen final de inventario
    inventory.printSummary();
    // 4. Demostración de consulta inteligente con IA al estado actual
    console.log('🤖 Realizando consulta de auditoría con el Agente de IA...');
    const stateSummaryText = `Partes registradas y niveles de stock actualizados correctamente tras procesar el flujo de eventos. Stock total en loc-A1: 200 unidades de la pieza p-101.`;
    const aiAnswer = await aiService.queryInventoryAssistant(stateSummaryText, '¿Tenemos suficiente stock en la ubicación principal y cuál es el estado general?');
    console.log(`\n💬 Respuesta del Asistente IA:\n${aiAnswer}\n`);
    // 5. Iniciar tareas programadas por lotes (Cron simulation)
    scheduler.startPeriodicCheck();
}
main().catch((err) => {
    console.error('❌ Error fatal en el agente:', err);
});
