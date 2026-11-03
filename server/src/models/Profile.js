import mongoose from 'mongoose';
import { jsonOptions } from '../utils/serialize.js';

const photoSchema = new mongoose.Schema({ url: String, publicId: String }, { _id: false });

const experienceSchema = new mongoose.Schema(
  {
    period: { type: String, required: true, trim: true, maxlength: 40 },
    role: { type: String, required: true, trim: true, maxlength: 100 },
    detail: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { _id: false },
);

// Un solo documento: el perfil público del portfolio.
const profileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 60 },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 60 },
    tagline: { type: String, required: true, trim: true, minlength: 1, maxlength: 60 },
    bio: { type: String, required: true, trim: true, minlength: 40, maxlength: 400 },
    email: { type: String, required: true, trim: true, lowercase: true },
    location: { type: String, required: true, trim: true, minlength: 3, maxlength: 60 },
    github: { type: String, trim: true, match: /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9-]+\/?$/ },
    linkedin: { type: String, trim: true, match: /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9-]+\/?$/ },
    photo: { type: photoSchema, default: null },
    stack: { type: [{ type: String, trim: true, minlength: 1, maxlength: 30 }], validate: (v) => v.length <= 16 },
    experience: { type: [experienceSchema], validate: (v) => v.length <= 10 },
  },
  { timestamps: true, toJSON: jsonOptions },
);

export const Profile = mongoose.model('Profile', profileSchema);
