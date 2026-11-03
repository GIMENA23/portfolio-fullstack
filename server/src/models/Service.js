import mongoose from 'mongoose';
import { jsonOptions } from '../utils/serialize.js';

// Los mismos nombres de tono e íconos que usa el panel (ServicesAdmin) y el sitio público.
export const SERVICE_COLORS = ['carmin', 'negro', 'vicuna', 'exito', 'oro'];
export const SERVICE_ICONS = ['code', 'server', 'database', 'chat'];

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 60 },
    description: { type: String, required: true, trim: true, maxlength: 300 },
    icon: { type: String, enum: SERVICE_ICONS, default: SERVICE_ICONS[0] },
    color: { type: String, enum: SERVICE_COLORS, default: SERVICE_COLORS[0] },
    // Entero ≥ 0. Null significa "a consultar".
    priceFrom: { type: Number, default: null, min: 0, validate: { validator: (v) => v === null || Number.isInteger(v), message: 'Solo números, sin puntos ni signo $.' } },
    order: { type: Number, required: true, min: 0, max: 999 },
    visible: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: jsonOptions },
);

// Nombre único sin distinguir mayúsculas ni tildes.
serviceSchema.index({ name: 1 }, { unique: true, collation: { locale: 'es', strength: 1 } });

export const Service = mongoose.model('Service', serviceSchema);
