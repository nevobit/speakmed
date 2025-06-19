import { Schema } from 'mongoose';

export const UserSchemaMongo = new Schema(
  {
    name: { type: String },
    identification: { type: Number },
    city: { type: String },
    country: { type: String },
    email: { type: String },
    enterprise: { type: String },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);