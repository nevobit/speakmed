import { Schema } from 'mongoose';

export const ReportSchemaMongo = new Schema(
    {
        userId: { type: String, required: true },
        templateId: { type: String },
        content: { type: String, required: true },
        date: { type: Date, required: true },
        duration: { type: String },
        summary: { type: String },
    },
    {
        versionKey: false,
        timestamps: true,
    },
); 