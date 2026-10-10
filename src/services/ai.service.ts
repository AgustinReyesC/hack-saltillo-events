import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';

dotenv.config();

// El handler compara contra este texto para responder con el resumen sin IA cuando Gemini falla.
export const AI_QUERY_ERROR = '⚠️ Ocurrió un error al consultar el asistente de inventario.';

export class AIService {
  private ai: GoogleGenAI;
  private modelName: string;

  constructor() {
    // Inicializa el cliente de Google Gen AI con tu API Key
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    // Usamos el modelo adecuado según la configuración de tu proyecto (GEMINI_MODEL lo cambia sin redesplegar)
    this.modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  }

  /**
   * Da formato decorativo y asegura saltos de línea limpios para las viñetas y secciones.
   */
  private formatAiResponse(text: string): string {
    if (!text) return '';

    let formatted = text
      // 1. Títulos y viñetas de Markdown al inicio de línea (### Título, - item, * item)
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^(\s*)[-*]\s+/gm, '$1• ')

      // 2. Limpiamos asteriscos de Markdown sobrantes
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')

      // 3. Forzamos saltos de línea antes de los títulos principales que llevan emojis o secciones clave
      .replace(/([.?!])\s*(🔧|📦|⚠️|📍|✅|📊)/g, '$1\n\n$2')
      .replace(/([a-zA-Z0-9\)])\s+(🔧|📦|⚠️|📍|✅|📊)/g, '$1\n\n$2')

      // 4. Cada viñeta • en su propio renglón aunque venga pegada al texto ("stock • A • B").
      //    Solo el símbolo •: un guion a media frase ("5 - 3", "R061026012 - Motor") no es viñeta.
      .replace(/(\S)[ \t]*•[ \t]*/g, '$1\n• ')

      // 5. Listas numeradas pegadas a la frase anterior ("Opciones: 1. Comprar 2. Reparar"),
      //    sin tocar decimales ni fechas (5.5, 10.10.2026)
      .replace(/([.?!:])[ \t]+(\d+\.\s)/g, '$1\n\n$2')
      .replace(/\n{3,}/g, '\n\n');

    return formatted.trim();
  }
  /**
   * Consulta general para el asistente de inventario (atiende a la UI)
   */
  public async queryInventoryAssistant(inventoryStateSummary: string, userQuery: string): Promise<string> {
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

    } catch (error) {
      console.error('[AIService] Error al generar respuesta estructurada:', error);
      return AI_QUERY_ERROR;
    }
  }

  /**
   * Analiza defectos reportados en inspecciones de calidad mediante IA
   */
  public async analyzeDefect(partName: string, notes: string): Promise<string> {
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

    } catch (error) {
      console.error('[AIService] Error al analizar defecto con IA:', error);
      return '⚠️ Error al procesar el análisis de defecto.';
    }
  }
}