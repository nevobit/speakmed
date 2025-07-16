import { Schema } from 'mongoose';

export const TemplateSchemaMongo = new Schema(
    {
        name: { type: String, required: true },
        type: { type: String, required: true }, // Ej: 'Cirugía', 'Consulta', etc.
        fields: [{ type: String }], // Campos personalizados de la plantilla
        userId: { type: String },
    },
    {
        versionKey: false,
        timestamps: true,
    },
); 