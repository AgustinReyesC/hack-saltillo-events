"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
const validator_service_1 = require("./services/validator.service");
async function main() {
    console.log('🚀 Iniciando procesador de eventos de inventario...');
    // Inicializar el servicio de validación
    const validator = new validator_service_1.ValidatorService();
    // Ruta hacia el archivo events.jsonl ubicado en la carpeta data/
    const eventsFilePath = path.resolve(__dirname, '../data/events.jsonl');
    if (!fs.existsSync(eventsFilePath)) {
        console.error(`❌ No se encontró el archivo de eventos en: ${eventsFilePath}`);
        console.log(`💡 Asegúrate de colocar tu archivo 'events.jsonl' dentro de la carpeta 'data/'.`);
        return;
    }
    console.log(`📂 Leyendo eventos desde: ${eventsFilePath}\n`);
    // Configurar el lector de líneas
    const fileStream = fs.createReadStream(eventsFilePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    let lineNumber = 0;
    let validCount = 0;
    let invalidCount = 0;
    for await (const line of rl) {
        lineNumber++;
        // Ignorar líneas vacías
        if (!line.trim())
            continue;
        try {
            const event = JSON.parse(line);
            const eventType = event.eventType || event.type || 'unknown';
            // Validar el evento con nuestro servicio
            const validation = validator.validate(eventType, event);
            if (validation.valid) {
                validCount++;
                console.log(`[Línea ${lineNumber}] ✅ Evento válido: ${eventType} (ID: ${event.eventId || 'N/A'})`);
            }
            else {
                invalidCount++;
                console.warn(`[Línea ${lineNumber}] ❌ Evento inválido: ${eventType}`);
                console.warn(`   Errores:`, validation.errors);
            }
        }
        catch (parseError) {
            invalidCount++;
            console.error(`[Línea ${lineNumber}] ⚠️ Error al parsear JSON en la línea:`, parseError);
        }
    }
    console.log('\n----------------------------------------');
    console.log(`📊 Procesamiento finalizado:`);
    console.log(`   - Total de líneas procesadas: ${lineNumber}`);
    console.log(`   - Eventos válidos: ${validCount}`);
    console.log(`   - Eventos inválidos o con errores: ${invalidCount}`);
    console.log('----------------------------------------');
}
main().catch((err) => {
    console.error('❌ Error fatal en la ejecución:', err);
});
//# sourceMappingURL=index.js.map