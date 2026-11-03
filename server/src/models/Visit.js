import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
  path: { type: String, required: true, maxlength: 200 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  sessionId: { type: String, required: true, maxlength: 100 },
  createdAt: { type: Date, default: Date.now, index: true },
});

// Una visita por sesión y página: recargar no suma. Al ser único, dos pedidos simultáneos tampoco duplican.
visitSchema.index({ sessionId: 1, path: 1 }, { unique: true });

export const Visit = mongoose.model('Visit', visitSchema);
