import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Counter } from '../models/Counter.js';
import { Inquiry } from '../models/Inquiry.js';
import { Login } from '../models/Login.js';
import { LoginAttempt } from '../models/LoginAttempt.js';
import { Profile } from '../models/Profile.js';
import { Project } from '../models/Project.js';
import { Service } from '../models/Service.js';
import { User } from '../models/User.js';
import { Visit } from '../models/Visit.js';
import { defaultProfile, firstNames, inquiryPools, lastNames, namedUsers, projects, replyTexts, services } from './data.js';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const SALTA_OFFSET = 3 * HOUR; // Salta es UTC−3: los días del dashboard se cuentan en esa hora

// Aleatorio con semilla: cada corrida genera los mismos datos (las fechas son relativas a `now`).
function mulberry32(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Medianoche de Salta del día que está `daysAgo` días antes de `now`.
function startOfDay(now, daysAgo) {
  const local = new Date(now.getTime() - SALTA_OFFSET);
  return Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - daysAgo) + SALTA_OFFSET;
}

function startOfMonth(now) {
  const local = new Date(now.getTime() - SALTA_OFFSET);
  return Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) + SALTA_OFFSET;
}

const slug = (text) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

// Borra todas las colecciones y las vuelve a cargar con datos que reproducen el prototipo.
export async function runSeed({ password, now = new Date() }) {
  const rand = mulberry32(2026);
  const int = (min, max) => min + Math.floor(rand() * (max - min + 1));
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const at = (ms) => new Date(ms);

  await Promise.all([Counter, Inquiry, Login, LoginAttempt, Profile, Project, Service, User, Visit].map((model) => model.deleteMany({})));

  // --- Usuarios: 1 admin, 1 operador, usuario@portfolio.test, 5 con nombre y 32 generados = 40
  const passwordHash = await bcrypt.hash(password, 10);
  const monthStart = startOfMonth(now);
  const thisMonth = () => at(monthStart + Math.floor(rand() * (now.getTime() - monthStart)));
  const beforeThisMonth = () => at(monthStart - int(1, 100) * DAY - int(0, 23) * HOUR);

  const accounts = [
    { name: 'Admin Portfolio', email: 'admin@portfolio.test', role: 'admin', createdAt: at(startOfDay(now, 60) + 10 * HOUR) },
    { name: 'Operador Portfolio', email: 'operador@portfolio.test', role: 'operator', createdAt: at(startOfDay(now, 60) + 10 * HOUR) },
    { name: 'Usuario Portfolio', email: 'usuario@portfolio.test', createdAt: beforeThisMonth() },
    ...namedUsers.map((named) => ({ ...named, createdAt: named.thisMonth ? thisMonth() : beforeThisMonth() })),
  ];

  const taken = new Set(accounts.map((account) => account.email));
  const usedNames = new Set(accounts.map((account) => account.name));
  while (accounts.length < 40) {
    const first = pick(firstNames);
    const last = pick(lastNames);
    const name = `${first} ${last}`;
    let email = `${slug(first)}.${slug(last)}@ejemplo.com`;
    if (usedNames.has(name)) continue;
    usedNames.add(name);
    for (let n = 2; taken.has(email); n++) email = `${slug(first)}.${slug(last)}${n}@ejemplo.com`;
    taken.add(email);
    // Los que faltan para llegar a 6 en el mes en curso (Valentina, Lucía y Mateo ya cuentan).
    const recent = accounts.filter((account) => account.createdAt.getTime() >= monthStart).length < 6;
    accounts.push({ name, email, createdAt: recent ? thisMonth() : beforeThisMonth() });
  }

  const users = accounts.map((account) => ({
    _id: new mongoose.Types.ObjectId(),
    name: account.name,
    email: account.email,
    role: account.role ?? 'user',
    active: account.active ?? true,
    ...(account.google ? { googleId: `seed-google-${slug(account.name)}` } : { passwordHash }),
    newsletter: rand() < 0.3,
    termsAcceptedAt: account.createdAt,
    loginCount: 0,
    lastLogin: null,
    createdAt: account.createdAt,
    updatedAt: account.createdAt,
  }));

  // --- Accesos (logins) de los últimos 30 días, unos 22 por día. El admin y el operador entran más seguido.
  const logins = [];
  const visits = [];
  const pages = ['/', '/', '/', '/proyectos', '/proyectos', '/servicios', '/contacto', '/login', '/registro'];
  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const dayStart = startOfDay(now, daysAgo);
    const moment = () => dayStart + int(8 * 3600, 23 * 3600) * 1000; // entre las 8 y las 23 horas
    const eligible = users.filter((user) => user.active && user.createdAt.getTime() <= dayStart + DAY);
    const weighted = [...eligible, ...users.filter((user) => user.role !== 'user'), ...users.filter((user) => user.role !== 'user')];

    for (let i = int(14, 30); i > 0; i--) {
      const user = pick(weighted);
      const time = moment();
      if (time > now.getTime() || time < user.createdAt.getTime()) continue;
      logins.push({ userId: user._id, method: user.googleId ? 'google' : 'password', at: at(time) });
      user.loginCount += 1;
      if (!user.lastLogin || user.lastLogin.getTime() < time) user.lastLogin = at(time);
    }

    const visitsToday = int(24, 72);
    for (let i = 0; i < visitsToday; i++) {
      const time = moment();
      if (time > now.getTime()) continue;
      visits.push({
        path: pick(pages),
        userId: rand() < 0.2 ? pick(eligible)._id : null,
        sessionId: `seed-${daysAgo}-${i}`,
        createdAt: at(time),
      });
    }
  }

  // --- Consultas: 30 en los últimos 30 días (14 cotización, 9 general, 7 asesoría), numeradas de la más vieja a la más nueva
  const types = [...Array(14).fill('cotizacion'), ...Array(9).fill('general'), ...Array(7).fill('asesoria')];
  for (let i = types.length - 1; i > 0; i--) {
    const j = int(0, i);
    [types[i], types[j]] = [types[j], types[i]];
  }
  // De más vieja a más nueva: 5 cerradas, 11 respondidas, 6 en proceso y 8 nuevas.
  const statuses = [...Array(5).fill('cerrada'), ...Array(11).fill('respondida'), ...Array(6).fill('en_proceso'), ...Array(8).fill('nueva')];
  // Las dos consultas de Valentina (las que muestra "Mi cuenta"): una respondida y una en proceso.
  const valentinaAnswered = 10;
  const valentinaOpen = 18;
  const forceType = (index, type) => {
    if (types[index] === type) return;
    const other = types.findIndex((candidate, i) => candidate === type && i !== valentinaAnswered && i !== valentinaOpen);
    [types[index], types[other]] = [types[other], types[index]];
  };
  forceType(valentinaAnswered, 'cotizacion');
  forceType(valentinaOpen, 'asesoria');

  const valentina = users.find((user) => user.email === 'valentina@correo.com');
  const operator = users.find((user) => user.role === 'operator');
  const created = types.map((_, i) => now.getTime() - (30 * DAY * (types.length - i)) / (types.length + 1) - int(0, 6) * HOUR);
  const usedFromPool = { cotizacion: 0, general: 0, asesoria: 0 };
  const valentinaSamples = [inquiryPools.cotizacion[0], inquiryPools.asesoria[2]];

  const inquiries = types.map((type, i) => {
    const pool = inquiryPools[type].filter((sample) => !valentinaSamples.includes(sample));
    const isValentina = i === valentinaAnswered || i === valentinaOpen;
    const sample = i === valentinaAnswered ? valentinaSamples[0] : i === valentinaOpen ? valentinaSamples[1] : pool[usedFromPool[type]++ % pool.length];
    const person = isValentina ? { name: valentina.name, email: valentina.email } : { name: `${pick(firstNames)} ${pick(lastNames)}` };
    const email = person.email ?? `${slug(person.name)}${int(1, 99)}@ejemplo.com`;
    const status = statuses[i];
    const createdAt = created[i];
    const sentAt = createdAt + int(2, 30) * HOUR;
    const replies = ['respondida', 'cerrada'].includes(status) && sentAt < now.getTime()
      ? [{ text: pick(replyTexts), operatorId: operator._id, operatorName: operator.name, sentAt: at(sentAt) }]
      : [];

    return {
      number: i + 1,
      name: person.name,
      email,
      phone: rand() < 0.4 ? `387${int(1000000, 9999999)}` : undefined,
      type,
      budget: type === 'cotizacion' ? pick(['chico', 'medio', 'grande']) : null,
      subject: sample.subject,
      message: sample.message,
      status,
      userId: isValentina ? valentina._id : null,
      replies,
      createdAt: at(createdAt),
      updatedAt: at(replies[0] ? sentAt : createdAt),
    };
  });

  // --- Contenido público
  const projectDocs = projects.map(({ daysAgo, ...project }) => ({
    ...project,
    createdAt: at(startOfDay(now, daysAgo) + 12 * HOUR),
    updatedAt: at(startOfDay(now, Math.max(0, daysAgo - int(1, 20)) ) + 12 * HOUR),
  }));
  const serviceDocs = services.map((service, index) => ({ ...service, order: index + 1, visible: true }));

  const noStamps = { timestamps: false };
  await User.insertMany(users, noStamps);
  await Login.insertMany(logins);
  await User.bulkWrite(
    users.filter((user) => user.loginCount).map((user) => ({ updateOne: { filter: { _id: user._id }, update: { loginCount: user.loginCount, lastLogin: user.lastLogin } } })),
    noStamps,
  );
  await Visit.insertMany(visits);
  await Inquiry.insertMany(inquiries, noStamps);
  await Counter.create({ _id: 'inquiry', seq: inquiries.length });
  await Project.insertMany(projectDocs, noStamps);
  await Service.insertMany(serviceDocs);
  await Profile.create(defaultProfile);

  return {
    users: users.length,
    projects: projectDocs.length,
    services: serviceDocs.length,
    inquiries: inquiries.length,
    visits: visits.length,
    logins: logins.length,
    testAccounts: [
      { role: 'admin', email: 'admin@portfolio.test' },
      { role: 'operator', email: 'operador@portfolio.test' },
      { role: 'user', email: 'usuario@portfolio.test' },
    ],
  };
}
