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
            // 1. Limpiamos asteriscos de Markdown sobrantes si los llega a poner
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            // 2. Forzamos un salto de línea limpio antes de cualquier viñeta o número para que no se amontonen
            .replace(/([.?!])\s*([•\-\*]|\d+\.)/g, '$1\n\n$2')
            .replace(/([a-zA-Z0-9])\s+([•\-\*])/g, '$1\n• ');
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
        2. Utiliza emojis industriales relevantes (📦 para stock, ⚠️ para alertas/faltantes, 📍 para ubicaciones, 🔧 para reparaciones, ✅ para estados óptimos).
        3. Estructura la respuesta usando saltos de línea claros entre párrafos.
        4. Si vas a dar listas o puntos clave, colócalos obligatoriamente en renglones separados (un punto por línea), usando viñetas limpias (•).
        5. No uses asteriscos de Markdown (** o *), presenta el texto limpio y ordenado para lectura en pantalla móvil/web.
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
