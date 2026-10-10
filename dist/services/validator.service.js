import AjvModule from 'ajv';
import addFormatsModule from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';
// Ajuste para compatibilidad ESM con Ajv y ajv-formats
const Ajv = AjvModule.default || AjvModule;
const addFormats = addFormatsModule.default || addFormatsModule;
export class ValidatorService {
    ajv;
    validators = new Map();
    constructor() {
        this.ajv = new Ajv({ allErrors: true, strict: false });
        addFormats(this.ajv);
    }
    /**
     * Carga un esquema JSON desde un archivo y lo compila en AJV
     */
    loadSchema(eventType, schemaPath) {
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
        }
        catch (error) {
            console.error(`[Validator] Error cargando esquema para ${eventType}:`, error);
        }
    }
    /**
     * Valida un objeto contra un esquema previamente cargado
     */
    validate(eventType, data) {
        const validate = this.validators.get(eventType);
        if (!validate) {
            return { valid: true };
        }
        const valid = validate(data);
        if (!valid && validate.errors) {
            const errors = validate.errors.map((err) => `${err.instancePath} ${err.message}`);
            return { valid: false, errors };
        }
        return { valid: true };
    }
}
