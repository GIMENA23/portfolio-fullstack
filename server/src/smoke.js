// Prueba rápida de una API ya desplegada (o local). No crea ni borra datos.
//   API_URL=https://mi-api.onrender.com CLIENT_ORIGIN=https://mi-app.vercel.app npm run smoke
// Con ADMIN_PASSWORD (y opcionalmente ADMIN_EMAIL) prueba también el login y el dashboard del admin.

const api = (process.env.API_URL || process.argv[2] || '').replace(/\/+$/, '');
const origin = (process.env.CLIENT_ORIGIN || '').replace(/\/+$/, '');
const adminEmail = process.env.ADMIN_EMAIL || 'admin@portfolio.test';
const adminPassword = process.env.ADMIN_PASSWORD || '';

if (!api) {
  console.error('Falta API_URL. Ejemplo: API_URL=https://mi-api.onrender.com CLIENT_ORIGIN=https://mi-app.vercel.app npm run smoke');
  process.exit(1);
}

const base = `${api}/api`;
let failures = 0;

const check = async (label, test) => {
  try {
    const detail = await test();
    console.log(`✔ ${label}${detail ? ` — ${detail}` : ''}`);
  } catch (error) {
    failures += 1;
    console.log(`✖ ${label} — ${error.message}`);
  }
};
const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};
const request = async (path, { method = 'GET', headers = {}, body, timeout = 20_000 } = {}) => {
  const response = await fetch(base + path, {
    method,
    headers: { ...(body && { 'Content-Type': 'application/json' }), ...headers },
    body: body && JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // no todas las respuestas son JSON (por ejemplo el preflight de CORS de un origen no permitido)
  }
  return { response, json };
};

console.log(`Probando ${api}\n`);

await check('La URL usa HTTPS', () => {
  expect(api.startsWith('https://') || /^http:\/\/(localhost|127\.0\.0\.1)/.test(api), 'tiene que empezar con https://');
});

await check('GET /api/health responde (la primera vez puede tardar ~1 minuto si el servidor dormía)', async () => {
  const started = Date.now();
  const { response, json } = await request('/health', { timeout: 120_000 });
  expect(response.status === 200 && json?.ok === true, `respondió ${response.status}`);
  return `${((Date.now() - started) / 1000).toFixed(1)} s`;
});

if (origin) {
  const preflight = (from) =>
    request('/auth/login', {
      method: 'OPTIONS',
      headers: { Origin: from, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,authorization' },
    });

  await check(`CORS permite ${origin}`, async () => {
    const { response } = await preflight(origin);
    expect(response.headers.get('access-control-allow-origin') === origin, `access-control-allow-origin = ${response.headers.get('access-control-allow-origin')}; revisá CLIENT_URL en Render`);
  });
  await check('CORS rechaza un sitio ajeno', async () => {
    const { response } = await preflight('https://sitio-ajeno.example');
    expect(!response.headers.get('access-control-allow-origin'), 'permitió un origen que no debería');
  });
} else {
  console.log('· Sin CLIENT_ORIGIN: se omite la prueba de CORS');
}

let firstProjectId;
await check('Hay proyectos cargados (seed)', async () => {
  const { json } = await request('/projects');
  expect(json?.meta?.total > 0, 'no hay proyectos: corré el seed (ver DEPLOY.md)');
  firstProjectId = json.data[0].id;
  return `${json.meta.total} visibles`;
});
await check('Hay servicios y perfil', async () => {
  const services = await request('/services');
  const profile = await request('/profile');
  expect(services.json?.data?.length > 0, 'no hay servicios');
  expect(profile.json?.data?.name, 'el perfil no tiene nombre');
  return `${services.json.data.length} servicios · ${profile.json.data.name}`;
});
await check('El detalle de un proyecto exige sesión', async () => {
  const { response } = await request(`/projects/${firstProjectId ?? '6710f0c2a1b2c3d4e5f60718'}`);
  expect(response.status === 401, `respondió ${response.status} en lugar de 401`);
});
await check('Los endpoints de admin exigen sesión', async () => {
  for (const path of ['/users', '/stats/summary', '/inquiries', '/admin/projects']) {
    const { response } = await request(path);
    expect(response.status === 401, `${path} respondió ${response.status} en lugar de 401`);
  }
});

if (adminPassword) {
  let token;
  await check(`Login de ${adminEmail}`, async () => {
    const { response, json } = await request('/auth/login', { method: 'POST', body: { email: adminEmail, password: adminPassword } });
    expect(response.status === 200, `respondió ${response.status} (${json?.code ?? 'sin detalle'})`);
    expect(json.data.user.role === 'admin', `el rol es ${json.data.user.role}`);
    token = json.data.token;
  });
  if (token) {
    const auth = { Authorization: `Bearer ${token}` };
    await check('El dashboard devuelve números', async () => {
      const { response, json } = await request('/stats/summary', { headers: auth });
      expect(response.status === 200, `respondió ${response.status}`);
      return `visitas ${json.data.visits} · accesos ${json.data.logins} · usuarios ${json.data.users.total} · consultas ${json.data.inquiries}`;
    });
    await check('La bandeja de consultas responde', async () => {
      const { response, json } = await request('/inquiries', { headers: auth });
      expect(response.status === 200, `respondió ${response.status}`);
      return `${json.meta.total} consultas`;
    });
  }
} else {
  console.log('· Sin ADMIN_PASSWORD: se omite la prueba de login y dashboard');
}

console.log(failures ? `\n${failures} prueba(s) fallaron.` : '\nTodo bien.');
process.exitCode = failures ? 1 : 0; // sin process.exit(): en Windows cortar con conexiones abiertas hace que Node se cierre con un error
