import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

export function configureMongoose() {
  const uuidPlugin = function(schema: mongoose.Schema) {
    schema.add({
      _id: { type: String, default: randomUUID }
    });

    schema.set('toJSON', {
      virtuals: true,
      versionKey: false,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      }
    });

    schema.set('toObject', {
      virtuals: true,
      versionKey: false,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      }
    });
  };

  mongoose.plugin(uuidPlugin);
}