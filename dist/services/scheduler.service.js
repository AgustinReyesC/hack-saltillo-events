export class SchedulerService {
    inventoryService;
    intervalMinutes;
    constructor(inventoryService, intervalMinutes = 5) {
        this.inventoryService = inventoryService;
        this.intervalMinutes = intervalMinutes;
    }
    /**
     * Inicia el proceso por lotes simulado o programado
     */
    startPeriodicCheck() {
        console.log(`[Scheduler] ⏰ Tarea programada iniciada (Ejecución cada ${this.intervalMinutes} minutos).`);
        // Ejecución inicial de auditoría de stock
        this.runAudit();
        // Configurar intervalo (para pruebas de desarrollo puedes dejarlo o invocarlo bajo demanda)
        setInterval(() => {
            this.runAudit();
        }, this.intervalMinutes * 60 * 1000);
    }
    runAudit() {
        console.log('\n========================================');
        console.log('🔄 [Batch Job] Ejecutando auditoría automática de stock y reorden...');
        // Aquí podemos auditar si algún nivel de stock está por debajo del umbral mínimo
        this.inventoryService.printSummary();
        console.log('========================================\n');
    }
}
