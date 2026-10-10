import AjvModule from 'ajv';
import addFormatsModule from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';

// Ajuste para compatibilidad ESM con Ajv y ajv-formats
const Ajv = (AjvModule as any).default || AjvModule;
const addFormats = (addFormatsModule as any).default || addFormatsModule;

export class ValidatorService {
  private ajv: any;
  private validators: Map<string, any> = new Map();

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
  }

  /**
   * Carga un esquema JSON desde un archivo y lo compila en AJV
   */
  public loadSchema(eventType: string, schemaPath: string): void {
    try {
      const fullPath = path.resolve(schemaPath);
      if (!fs.existsSync(fullPath)) {
        console.warn(`[Validator] Archivo de esquema no encontrado: ${fullPath}`);
        return;
      }
      
      const schemaContent = fs.readFileSync(fullPath, 'utf-8');
      const schemaJson = JSON.parse(schemaContent);
      
      const validate = this.ajv.compile(schemaJson);
      this.validators.set(eventType, validate);
    } catch (error) {
      console.error(`[Validator] Error cargando esquema para ${eventType}:`, error);
    }
  }

  /**
   * Valida un objeto contra un esquema previamente cargado
   */
  public validate(eventType: string, data: any): { valid: boolean; errors?: string[] } {
    const validate = this.validators.get(eventType);
    
    if (!validate) {
      return { valid: true }; 
    }

    const valid = validate(data);
    if (!valid && validate.errors) {
      const errors = validate.errors.map((err: any) => `${err.instancePath} ${err.message}`);
      return { valid: false, errors };
    }

    return { valid: true };
  }
}