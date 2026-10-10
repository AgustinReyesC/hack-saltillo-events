import { AIService } from './ai.service.js';

export class InventoryService {
  private parts: Map<string, any> = new Map();
  private locations: Map<string, any> = new Map();
  private stockLevels: Map<string, number> = new Map();
  private aiService: AIService;
  // false en la auditoría programada: corre cada 10 min y agotaba la cuota de Gemini del chat.
  private analyzeDefects: boolean;

  constructor(analyzeDefects = true) {
    this.aiService = new AIService();
    this.analyzeDefects = analyzeDefects;
  }

  public async processEvent(event: { eventType: string; payload: any }): Promise<void> {
    const { eventType, payload } = event;

    switch (eventType) {
      case 'part.upserted':
        this.parts.set(payload.partId, payload);
        console.log(`   [Inventory] 📦 Parte registrada/actualizada: ${payload.name} (SKU: ${payload.sku})`);
        break;

      case 'location.upserted':
        this.locations.set(payload.locationId, payload);
        console.log(`   [Inventory] 📍 Ubicación registrada/actualizada: ${payload.name} (${payload.type})`);
        break;

      case 'purchase.item_received':
        this.addStock(payload.partId, payload.locationId, payload.quantityReceived);
        console.log(`   [Inventory] 📥 Stock recibido (Compra): +${payload.quantityReceived} de la parte ${payload.partId} en ${payload.locationId}`);
        break;

      case 'inspection.submitted':
        console.log(`   [Inventory] 🔍 Inspección registrada (${payload.inspectionId}): ${payload.quantity} unidades para parte ${payload.partId}`);
        
        // Si hay notas, usamos a Gemini para el análisis de calidad inteligente
        if (payload.notes && this.analyzeDefects) {
          const partInfo = this.parts.get(payload.partId);
          const partName = partInfo ? partInfo.name : 'Pieza General';
          
          console.log(`   [AI Analysis] 🤖 Consultando a Gemini para análisis de defecto...`);
          const recommendation = await this.aiService.analyzeDefect(partName, payload.notes);
          console.log(`   [AI Analysis] 💡 Decisión de Calidad: ${recommendation}`);
        }
        break;

      default:
        console.log(`   [Inventory] ℹ️ Evento ${eventType} sin regla específica.`);
        break;
    }
  }

  private addStock(partId: string, locationId: string, quantity: number): void {
    const key = `${partId}:${locationId}`;
    const current = this.stockLevels.get(key) || 0;
    this.stockLevels.set(key, current + quantity);
  }

  public printSummary(): void {
    console.log('\n========================================');
    console.log('📋 RESUMEN DE ESTADO DE INVENTARIO');
    console.log(`   - Partes en catálogo: ${this.parts.size}`);
    console.log(`   - Ubicaciones activas: ${this.locations.size}`);
    console.log('   - Niveles de Stock Actuales:');
    
    if (this.stockLevels.size === 0) {
      console.log('     (Sin stock registrado)');
    } else {
      this.stockLevels.forEach((qty, key) => {
        const [partId, locationId] = key.split(':');
        console.log(`     * Parte [${partId}] en Ubicación [loc-A1] -> Cantidad: ${qty}`);
      });
    }
    console.log('========================================\n');
  }
}