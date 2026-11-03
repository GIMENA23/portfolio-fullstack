import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 },
});

export const Counter = mongoose.model('Counter', counterSchema);

// Devuelve el próximo número de la secuencia `name` (1, 2, 3…), sin repetirse aunque haya pedidos simultáneos.
export async function nextSequence(name) {
  const counter = await Counter.findByIdAndUpdate(name, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' });
  return counter.seq;
}
