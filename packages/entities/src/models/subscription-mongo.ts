import { Schema } from 'mongoose';

export const SubscriptionSchemaMongo = new Schema(
    {
        userId: { type: String, required: true },
        plan: { type: String, required: true }, // Ej: 'BASIC', 'PLUS', 'ELITE'
        status: { type: String, default: 'active' }, // Ej: 'active', 'cancelled', 'expired'
        startDate: { type: Date, required: true },
        endDate: { type: Date },
    },
    {
        versionKey: false,
        timestamps: true,
    },
); 