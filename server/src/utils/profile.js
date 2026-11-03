import { Profile } from '../models/Profile.js';
import { defaultProfile } from '../seed/data.js';

// El perfil guardado, o el del seed si el admin todavía no guardó uno (igual que GET /api/profile).
export const currentProfile = async () => (await Profile.findOne()) ?? defaultProfile;
