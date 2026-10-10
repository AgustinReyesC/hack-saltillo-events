import * as fs from 'fs';
import * as readline from 'readline';
export class EventConsumerService {
    validator;
    inventory;
    constructor(validator, inventory) {
        this.validator = validator;
        this.inventory = inventory;
    }
    /**
     * Simula la recepción de eventos en tiempo real desde un Stream (Kafka / Archivo JSONL)
     */
    async consumeStream(filePath) {
        if (!fs.existsSync(filePath)) {
            console.error(`❌ No se encontró el stream de eventos en: ${filePath}`);
            return;
        }
        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
        let lineNumber = 0;
        for await (const line of rl) {
            lineNumber++;
            if (!line.trim())
                continue;
            try {
                const event = JSON.parse(line);
                const eventType = event.eventType || event.type || 'unknown';
                // 1. Validar esquema
                const validation = this.validator.validate(eventType, event);
                if (validation.valid) {
                    console.log(`[Stream Consumer] 📥 Evento recibido y validado: ${eventType}`);
                    // 2. Procesar en el motor de inventario (incluye llamada a IA si aplica)
                    await this.inventory.processEvent(event);
                }
                else {
                    console.warn(`[Stream Consumer] ❌ Evento descartado por esquema inválido (${eventType}):`, validation.errors);
                }
            }
            catch (err) {
                console.error(`[Stream Consumer] ⚠️ Error procesando mensaje en línea ${lineNumber}:`, err);
            }
        }
    }
}
