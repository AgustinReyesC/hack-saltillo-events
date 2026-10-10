import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();
export class AIService {
    ai;
    modelName = 'gemini-3.8-flash'; // 👈 Modelo estable estándar y compatible con el SDK actual
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        this.ai = new GoogleGenAI({ apiKey });
    }
    async analyzeDefect(partName, defectDescription) {
        try {
            const prompt = `
        Eres un asistente experto en gestión de inventario y control de calidad industrial.
        Analiza el siguiente reporte o nota de inspección para la pieza "${partName}":
        "${defectDescription}"

        Determina si la acción recomendada debe ser "REPARAR" o "REEMPLAZAR" y da una breve justificación técnica de una sola línea.
      `;
            const response = await this.ai.models.generateContent({
                model: this.modelName,
                contents: prompt,
            });
            return response.text ? response.text.trim() : 'No se pudo generar una recomendación.';
        }
        catch (error) {
            console.error('[AIService] Error al comunicarse con Gemini (Defecto):', error);
            return 'Error en el análisis de IA.';
        }
    }
    async queryInventoryAssistant(inventoryStateSummary, userQuery) {
        try {
            const prompt = `
        Eres el agente central de inteligencia artificial de un sistema de inventario industrial.
        
        ESTADO ACTUAL DEL INVENTARIO:
        ${inventoryStateSummary}

        PREGUNTA DEL USUARIO / AUDITOR:
        "${userQuery}"

        Responde de manera profesional, precisa y basada estrictamente en los datos del estado actual del inventario proporcionado.
      `;
            const response = await this.ai.models.generateContent({
                model: this.modelName,
                contents: prompt,
            });
            return response.text ? response.text.trim() : 'No se pudo procesar la consulta.';
        }
        catch (error) {
            console.error('[AIService] Error en consulta al asistente:', error);
            return 'Error al consultar el asistente de IA.';
        }
    }
}
