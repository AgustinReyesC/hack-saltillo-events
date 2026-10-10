export declare class ValidatorService {
    private ajv;
    private validators;
    constructor();
    /**
     * Carga un esquema JSON desde un archivo y lo compila en AJV
     * @param eventType Nombre o identificador del evento (ej: 'part.upserted')
     * @param schemaPath Ruta absoluta o relativa al archivo .json del esquema
     */
    loadSchema(eventType: string, schemaPath: string): void;
    /**
     * Valida un payload o evento contra un esquema previamente cargado
     * @param eventType Tipo de evento
     * @param data Objeto a validar
     */
    validate(eventType: string, data: any): {
        valid: boolean;
        errors?: string[];
    };
}
//# sourceMappingURL=validator.service.d.ts.map