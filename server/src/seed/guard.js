const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\]|::1)$/i;

// ¿La cadena de conexión apunta solo a esta máquina? ("mongodb://usuario:clave@host1:27017,host2/base")
export function isLocalDatabase(uri) {
  const hosts = /^mongodb(?:\+srv)?:\/\/(?:[^@/]*@)?([^/?]+)/.exec(uri ?? '')?.[1];
  if (!hosts) return false;
  return hosts.split(',').every((host) => LOCAL_HOST.test(host.replace(/:\d+$/, '')));
}

// El seed BORRA todo. Contra una base que no es local (Atlas) o en producción, además de la contraseña
// por defecto (que está en el repositorio, o sea que es pública), exige una contraseña propia y un --yes.
// Devuelve el motivo por el que no se puede correr, o null si está bien.
export function seedBlocker({ uri, password, confirmed, nodeEnv }) {
  if (isLocalDatabase(uri) && nodeEnv !== 'production') return null;

  if (!password || password.length < 10) {
    return 'Esta base no es local: definí SEED_PASSWORD (al menos 10 caracteres). La contraseña por defecto es pública y daría acceso de administrador.';
  }
  if (!confirmed) {
    return 'Esta base no es local y el seed borra todo lo que tenga. Si estás seguro, corré el comando de nuevo con --yes: npm run seed -- --yes';
  }
  return null;
}
