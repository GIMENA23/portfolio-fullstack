import mongoose from 'mongoose';
import { nextSequence } from './Counter.js';
import { jsonOptions } from '../utils/serialize.js';

const replySchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, minlength: 20, maxlength: 5000 },
    operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    operatorName: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number, required: true, max: 2 * 1024 * 1024 },
    mime: { type: String, enum: ['application/pdf', 'image/jpeg', 'image/png'], required: true },
  },
  { _id: false },
);

const inquirySchema = new mongoose.Schema(
  {
    // Correlativo para mostrar "N.º 0031". Se asigna solo al crear.
    number: { type: Number, unique: true },
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 60 },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, match: /^\d{10}$/ },
    type: { type: String, enum: ['general', 'cotizacion', 'asesoria'], required: true },
    budget: { type: String, enum: ['chico', 'medio', 'grande'], default: null },
    subject: { type: String, required: true, trim: true, minlength: 5, maxlength: 120 },
    message: { type: String, required: true, trim: true, minlength: 20, maxlength: 1000 },
    attachment: { type: attachmentSchema, default: null },
    status: { type: String, enum: ['nueva', 'en_proceso', 'respondida', 'cerrada'], default: 'nueva' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    replies: [replySchema],
    // Se completa cuando la persona elimina su cuenta: la consulta queda sin nombre, email ni vínculo.
    anonymizedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: jsonOptions },
);

inquirySchema.pre('validate', async function assignNumber() {
  if (this.isNew && !this.number) this.number = await nextSequence('inquiry');
});

export const Inquiry = mongoose.model('Inquiry', inquirySchema);
