import { Schema } from 'mongoose';
import { Report } from './report';

export const ReportSchemaMongo = new Schema<Report>(
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