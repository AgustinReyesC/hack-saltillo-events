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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidatorService = void 0;
const ajv_1 = __importDefault(require("ajv"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ValidatorService {
    ajv;
    validators = new Map();
    constructor() {
        // Inicializamos AJV permitiendo datos adicionales o configuraciones estrictas según los esquemas
        this.ajv = new ajv_1.default({ allErrors: true, strict: false });
        (0, ajv_formats_1.default)(this.ajv);
    }
    /**
     * Carga un esquema JSON desde un archivo y lo compila en AJV
     * @param eventType Nombre o identificador del evento (ej: 'part.upserted')
     * @param schemaPath Ruta absoluta o relativa al archivo .json del esquema
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
     * Valida un payload o evento contra un esquema previamente cargado
     * @param eventType Tipo de evento
     * @param data Objeto a validar
     */
    validate(eventType, data) {
        const validate = this.validators.get(eventType);
        if (!validate) {
            // Si no hay esquema cargado para este tipo, podemos decidir si aceptarlo o rechazarlo
            return { valid: true };
        }
        const valid = validate(data);
        if (!valid && validate.errors) {
            const errors = validate.errors.map(err => `${err.instancePath} ${err.message}`);
            return { valid: false, errors };
        }
        return { valid: true };
    }
}
exports.ValidatorService = ValidatorService;
//# sourceMappingURL=validator.service.js.map