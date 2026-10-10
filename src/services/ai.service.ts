import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';

dotenv.config();

export class AIService {
  private ai: GoogleGenAI;
  private modelName = 'gemini-3.8-flash'; // 👈 Modelo estable estándar y compatible con el SDK actual

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    this.ai = new GoogleGenAI({ apiKey });
  }

  public async analyzeDefect(partName: string, defectDescription: string): Promise<string> {
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
    } catch (error) {
      console.error('[AIService] Error al comunicarse con Gemini (Defecto):', error);
      return 'Error en el análisis de IA.';
    }
  }

<<<<<<< HEAD
  private cleanAiResponse(text: string): string {
    if (!text) return '';

    // Opción A: Si quieres remover los asteriscos por completo para que no aparezcan en la UI:
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remueve negritas (**texto** -> texto)
      .replace(/\*(.*?)\*/g, '$1')     // Remueve cursivas (*texto* -> texto)
      .replace(/[-*]\s+/g, '• ');      // Normaliza guiones a viñetas limpias
  }

=======
>>>>>>> 5bbab08f38d1e352939f91f5af12e5ba93e8f343
  public async queryInventoryAssistant(inventoryStateSummary: string, userQuery: string): Promise<string> {
    try {
      const prompt = `
        Eres el agente central de inteligencia artificial de un sistema de inventario industrial.
        
        ESTADO ACTUAL DEL INVENTARIO:
        ${inventoryStateSummary}

        PREGUNTA DEL USUARIO / AUDITOR:
        "${userQuery}"

<<<<<<< HEAD
        Responde de manera profesional, precisa y basada estrictamente en los datos del estado actual del inventario proporcionado. Evita usar demasiados símbolos de formato Markdown ya que la interfaz los muestra como texto plano.
=======
        Responde de manera profesional, precisa y basada estrictamente en los datos del estado actual del inventario proporcionado.
>>>>>>> 5bbab08f38d1e352939f91f5af12e5ba93e8f343
      `;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
      });

<<<<<<< HEAD
      const rawText = response.text ? response.text.trim() : 'No se pudo procesar la consulta.';
      
      // Limpiamos la respuesta antes de regresarla a la UI
      return this.cleanAiResponse(rawText);

=======
      return response.text ? response.text.trim() : 'No se pudo procesar la consulta.';
>>>>>>> 5bbab08f38d1e352939f91f5af12e5ba93e8f343
    } catch (error) {
      console.error('[AIService] Error en consulta al asistente:', error);
      return 'Error al consultar el asistente de IA.';
    }
  }
}