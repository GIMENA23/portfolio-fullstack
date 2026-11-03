// Forma pública del usuario (sección 3 del contrato). Nunca incluye hashes ni tokens.
export const publicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  active: user.active,
  providers: [...(user.googleId ? ['google'] : []), ...(user.passwordHash ? ['email'] : [])],
  newsletter: user.newsletter,
  loginCount: user.loginCount,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
});

const file = (value) => (value ? { url: value.url, publicId: value.publicId } : null);

// Lo único que ve un visitante de un proyecto: sin demo, repo ni textos largos.
export const projectSummary = (project) => ({
  id: String(project._id),
  title: project.title,
  summary: project.summary,
  stack: [...project.stack],
  cover: project.images[0]?.url ?? null,
  featured: project.featured,
});

export const projectDetail = (project) => ({
  id: String(project._id),
  title: project.title,
  summary: project.summary,
  problem: project.problem,
  solution: project.solution,
  highlights: [...project.highlights],
  role: project.role,
  duration: project.duration,
  stack: [...project.stack],
  images: project.images.map(file),
  demoUrl: project.demoUrl ?? null,
  repoUrl: project.repoUrl ?? null,
  featured: project.featured,
  visible: project.visible,
  updatedAt: project.updatedAt,
});

// `visible` solo lo ve el admin.
export const serviceOut = (service, { admin = false } = {}) => ({
  id: String(service._id),
  name: service.name,
  description: service.description,
  color: service.color,
  priceFrom: service.priceFrom ?? null,
  order: service.order,
  ...(admin && { visible: service.visible }),
});

// Sirve tanto para el documento de Mongo como para el perfil por defecto del seed.
export const profileOut = (profile) => ({
  name: profile.name,
  title: profile.title,
  phrase: profile.phrase,
  bio: profile.bio,
  email: profile.email,
  location: profile.location,
  github: profile.github ?? null,
  linkedin: profile.linkedin ?? null,
  photo: profile.photo?.url ? file(profile.photo) : null,
  stack: [...profile.stack],
  experience: profile.experience.map(({ period, role, detail }) => ({ period, role, detail })),
});

// Fila de la bandeja del operador.
export const inquiryRow = (inquiry) => ({
  id: String(inquiry._id),
  number: inquiry.number,
  name: inquiry.name,
  email: inquiry.email,
  type: inquiry.type,
  subject: inquiry.subject,
  status: inquiry.status,
  repliesCount: inquiry.replies.length,
  anonymized: Boolean(inquiry.anonymizedAt),
  createdAt: inquiry.createdAt,
});

const reply = (item) => ({ text: item.text, operatorId: String(item.operatorId), operatorName: item.operatorName, sentAt: item.sentAt });

export const inquiryReplies = (inquiry) => inquiry.replies.map(reply);

export const inquiryDetail = (inquiry) => ({
  id: String(inquiry._id),
  number: inquiry.number,
  name: inquiry.name,
  email: inquiry.email,
  phone: inquiry.phone ?? null,
  type: inquiry.type,
  budget: inquiry.budget ?? null,
  subject: inquiry.subject,
  message: inquiry.message,
  attachment: inquiry.attachment?.url ? { url: inquiry.attachment.url, name: inquiry.attachment.name, size: inquiry.attachment.size, mime: inquiry.attachment.mime } : null,
  status: inquiry.status,
  userId: inquiry.userId ? String(inquiry.userId) : null,
  anonymized: Boolean(inquiry.anonymizedAt),
  replies: inquiryReplies(inquiry),
  createdAt: inquiry.createdAt,
  updatedAt: inquiry.updatedAt,
});

// "Mis consultas" de quien tiene sesión.
export const inquiryMine = (inquiry) => {
  const last = inquiry.replies.at(-1);
  return {
    id: String(inquiry._id),
    number: inquiry.number,
    type: inquiry.type,
    subject: inquiry.subject,
    status: inquiry.status,
    createdAt: inquiry.createdAt,
    lastReply: last ? { text: last.text, sentAt: last.sentAt } : null,
  };
};

export const jsonOptions = {
  versionKey: false,
  transform(_doc, ret) {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
};
