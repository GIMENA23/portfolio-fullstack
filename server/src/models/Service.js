import mongoose from 'mongoose';
import { jsonOptions } from '../utils/serialize.js';

export const SERVICE_COLORS = ['#9B1B22', '#160F10', '#8A5A35', '#4F6B3E', '#7A5A12'];

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 60 },
    description: { type: String, required: true, trim: true, maxlength: 300 },
    color: { type: String, enum: SERVICE_COLORS, default: SERVICE_COLORS[0] },
    // Entero ≥ 0. Null significa "a consultar".
    priceFrom: { type: Number, default: null, min: 0, validate: { validator: (v) => v === null || Number.isInteger(v), message: 'Solo números, sin puntos ni signo $.' } },
    order: { type: Number, required: true, min: 1 },
    visible: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: jsonOptions },
);

// Nombre único sin distinguir mayúsculas ni tildes.
serviceSchema.index({ name: 1 }, { unique: true, collation: { locale: 'es', strength: 1 } });

export const Service = mongoose.model('Service', serviceSchema);
