import { Schema } from 'mongoose';

export const SettingsSchemaMongo = new Schema(
    {
        userId: { type: String, required: true },
        perspective: { type: String, default: 'Tercera persona' },
        detailLevel: { type: String, default: 'Detallado' },
        missingInfo: { type: String, default: 'Respuesta breve' },
        dictionary: [{ type: String }],
    },
    {
        versionKey: false,
        timestamps: true,
    },
); 