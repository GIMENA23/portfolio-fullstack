// Cada objeto lleva `_id` (lo que lee el frontend) e `id` (el nombre del contrato de la API).
const ids = (doc) => ({ _id: String(doc._id), id: String(doc._id) });

// Forma pública del usuario (sección 3 del contrato). Nunca incluye hashes ni tokens.
export const publicUser = (user) => ({
  ...ids(user),
  name: user.name,
  email: user.email,
  role: user.role,
  active: user.active,
  provider: user.googleId ? 'google' : 'local',
  providers: [...(user.googleId ? ['google'] : []), ...(user.passwordHash ? ['email'] : [])],
  newsletter: user.newsletter,
  loginCount: user.loginCount,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
});

const imageUrls = (project) => project.images.map((image) => image.url);

// Lo único que ve un visitante de un proyecto: sin demo, repo ni textos largos.
export const projectSummary = (project) => ({
  ...ids(project),
  title: project.title,
  summary: project.summary,
  stack: [...project.stack],
  images: imageUrls(project),
  cover: project.images[0]?.url ?? null,
  featured: project.featured,
});

export const projectDetail = (project) => ({
  ...ids(project),
  title: project.title,
  summary: project.summary,
  description: project.description ?? '',
  problem: project.problem,
  solution: project.solution,
  highlights: [...project.highlights],
  features: [...project.highlights],
  role: project.role,
  duration: project.duration,
  stack: [...project.stack],
  images: imageUrls(project),
  demoUrl: project.demoUrl ?? null,
  repoUrl: project.repoUrl ?? null,
  featured: project.featured,
  visible: project.visible,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
});

// `visible` solo lo ve el admin.
export const serviceOut = (service, { admin = false } = {}) => ({
  ...ids(service),
  name: service.name,
  description: service.description,
  icon: service.icon,
  color: service.color,
  priceFrom: service.priceFrom ?? null,
  order: service.order,
  ...(admin && { visible: service.visible }),
});

// Sirve tanto para el documento de Mongo como para el perfil por defecto del seed.
export const profileOut = (profile) => ({
  name: profile.name,
  title: profile.title,
  tagline: profile.tagline,
  bio: profile.bio,
  email: profile.email,
  location: profile.location,
  github: profile.github ?? '',
  linkedin: profile.linkedin ?? '',
  photo: profile.photo?.url ?? '',
  stack: [...profile.stack],
  experience: profile.experience.map(({ period, role, detail }) => ({ period, role, detail })),
});

const reply = (item) => ({
  text: item.text,
  operatorId: String(item.operatorId),
  operatorName: item.operatorName,
  operator: { name: item.operatorName },
  sentAt: item.sentAt,
});

export const inquiryReplies = (inquiry) => inquiry.replies.map(reply);

const attachmentOut = (inquiry) =>
  inquiry.attachment?.url ? { url: inquiry.attachment.url, name: inquiry.attachment.name, size: inquiry.attachment.size, mime: inquiry.attachment.mime } : null;

// Fila de la bandeja del operador. El panel despliega la fila sin pedir el detalle, así que trae también
// el mensaje y las respuestas.
export const inquiryRow = (inquiry) => ({
  ...ids(inquiry),
  number: inquiry.number,
  name: inquiry.name,
  email: inquiry.email,
  phone: inquiry.phone ?? null,
  type: inquiry.type,
  budget: inquiry.budget ?? null,
  subject: inquiry.subject,
  message: inquiry.message,
  attachment: attachmentOut(inquiry),
  status: inquiry.status,
  repliesCount: inquiry.replies.length,
  replies: inquiryReplies(inquiry),
  anonymized: Boolean(inquiry.anonymizedAt),
  createdAt: inquiry.createdAt,
});

export const inquiryDetail = (inquiry) => ({
  ...inquiryRow(inquiry),
  userId: inquiry.userId ? String(inquiry.userId) : null,
  updatedAt: inquiry.updatedAt,
});

// "Mis consultas" de quien tiene sesión.
export const inquiryMine = (inquiry) => {
  const last = inquiry.replies.at(-1);
  return {
    ...ids(inquiry),
    number: inquiry.number,
    type: inquiry.type,
    subject: inquiry.subject,
    message: inquiry.message,
    status: inquiry.status,
    createdAt: inquiry.createdAt,
    replies: inquiry.replies.map(({ text, sentAt }) => ({ text, sentAt })),
    lastReply: last ? { text: last.text, sentAt: last.sentAt } : null,
  };
};

export const jsonOptions = {
  versionKey: false,
  transform(_doc, ret) {
    ret.id = String(ret._id);
    ret._id = ret.id;
    return ret;
  },
};
