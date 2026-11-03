import mongoose from 'mongoose';
import { jsonOptions } from '../utils/serialize.js';

const imageSchema = new mongoose.Schema({ url: { type: String, required: true }, publicId: { type: String, required: true } }, { _id: false });

const httpsUrl = { validator: (v) => !v || /^https:\/\/\S+\.\S+/.test(v), message: 'Tiene que empezar con https://' };

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 80 },
    summary: { type: String, required: true, trim: true, maxlength: 200 },
    problem: { type: String, trim: true, maxlength: 1000, default: '' },
    solution: { type: String, trim: true, maxlength: 1000, default: '' },
    highlights: { type: [{ type: String, trim: true, maxlength: 160 }], validate: (v) => v.length <= 6 },
    role: { type: String, trim: true, maxlength: 80, default: '' },
    duration: { type: String, trim: true, maxlength: 40, default: '' },
    stack: {
      type: [{ type: String, trim: true, minlength: 1, maxlength: 24 }],
      validate: [(v) => v.length >= 1 && v.length <= 12, 'Indicá al menos una tecnología.'],
    },
    images: { type: [imageSchema], validate: (v) => v.length <= 5 },
    demoUrl: { type: String, default: null, validate: httpsUrl },
    repoUrl: { type: String, default: null, validate: httpsUrl },
    visible: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: jsonOptions },
);

export const Project = mongoose.model('Project', projectSchema);
