import { Inquiry } from '../models/Inquiry.js';
import { Login } from '../models/Login.js';
import { User } from '../models/User.js';
import { Visit } from '../models/Visit.js';

export const DELETED_NAME = 'Cuenta eliminada';
export const DELETED_EMAIL = 'eliminada@anonimo.invalid'; // .invalid está reservado: nunca recibe un email

// Borra una cuenta. Sus consultas se anonimizan en vez de borrarse (sin nombre, email, teléfono, adjunto ni vínculo
// con la cuenta; el asunto y el mensaje quedan), así siguen en la bandeja del operador y las estadísticas no cambian.
// Los accesos y las visitas también se conservan, sin dueño. Lo usan "Eliminar mi cuenta" y el admin desde Usuarios.
export async function deleteAccount(userId) {
  await Inquiry.updateMany(
    { userId },
    { $set: { name: DELETED_NAME, email: DELETED_EMAIL, userId: null, anonymizedAt: new Date() }, $unset: { phone: '', attachment: '' } },
  );
  await Login.updateMany({ userId }, { userId: null });
  await Visit.updateMany({ userId }, { userId: null });
  await User.deleteOne({ _id: userId });
}
