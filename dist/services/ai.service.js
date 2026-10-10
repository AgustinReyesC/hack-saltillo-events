import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();
export class AIService {
    ai;
    modelName;
    constructor() {
        // Inicializa el cliente de Google Gen AI con tu API Key
        this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        // Usamos el modelo adecuado según la configuración de tu proyecto
        this.modelName = 'gemini-3.8-flash';
    }
    /**
     * Da formato decorativo y asegura saltos de línea limpios para las viñetas y secciones.
     */
    formatAiResponse(text) {
        if (!text)
            return '';
        let formatted = text
            // 1. Limpiamos asteriscos de Markdown sobrantes
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            // 2. Forzamos saltos de línea antes de los títulos principales que llevan emojis o secciones clave
            .replace(/([.?!])\s*(🔧|📦|⚠️|📍|✅|📊)/g, '$1\n\n$2')
            .replace(/([a-zA-Z0-9\)])\s+(🔧|📦|⚠️|📍|✅|📊)/g, '$1\n\n$2')
            // 3. Forzamos un salto de línea limpio antes de cada viñeta (•) para que nunca se amontonen
            .replace(/([.?!])\s*(•|\-|\*)/g, '$1\n$2')
            .replace(/([a-zA-Z0-9\)])\s+(•|\-|\*)/g, '$1\n• ');
        return formatted.trim();
    }
    /**
     * Consulta general para el asistente de inventario (atiende a la UI)
     */
    async queryInventoryAssistant(inventoryStateSummary, userQuery) {
        try {
            const prompt = `
        Eres el asistente inteligente experto en gestión de inventario industrial y almacenes.
        
        ESTADO ACTUAL DE LOS DATOS:
        ${inventoryStateSummary}

        CONSULTA DEL USUARIO:
        "${userQuery}"

        INSTRUCCIONES DE FORMATO ESTRICTAS:
        1. Sé claro, directo y profesional.
        2. Utiliza emojis industriales relevantes (📦 para stock, ⚠️ para alertas/faltantes, 📍 para ubicaciones, 🔧 para reparaciones).
        3. IMPORTANTE: Cada sección principal (como 🔧 Órdenes de Trabajo Relacionadas o 📦 Estado Actual de Inventario) DEBE ir en una nueva línea separada por espacios en blanco.
        4. Cada viñeta (•) DEBE ir obligatoriamente en su propio renglón independiente (un punto por línea), nunca de corrido.
        5. No uses asteriscos de Markdown (** o *), presenta el texto limpio y ordenado.
      `;
            const response = await this.ai.models.generateContent({
                model: this.modelName,
                contents: prompt,
            });
            const rawText = response.text ? response.text.trim() : 'No se pudo procesar la consulta.';
            return this.formatAiResponse(rawText);
        }
        catch (error) {
            console.error('[AIService] Error al generar respuesta estructurada:', error);
            return '⚠️ Ocurrió un error al consultar el asistente de inventario.';
        }
    }
    /**
     * Analiza defectos reportados en inspecciones de calidad mediante IA
     */
    async analyzeDefect(partName, notes) {
        try {
            const prompt = `
        Eres el experto en control de calidad de un taller industrial.
        Analiza las notas del defecto para la pieza "${partName}": "${notes}".
        Proporciona una recomendación técnica breve sobre la acción a tomar (ej: reparar localmente, rechazar lote, comprar repuesto, etc.).
        Sé directo y sin asteriscos de Markdown.
      `;
            const response = await this.ai.models.generateContent({
                model: this.modelName,
                contents: prompt,
            });
            const rawText = response.text ? response.text.trim() : 'Sin recomendación de calidad.';
            return this.formatAiResponse(rawText);
        }
        catch (error) {
            console.error('[AIService] Error al analizar defecto con IA:', error);
            return '⚠️ Error al procesar el análisis de defecto.';
        }
    }
}
