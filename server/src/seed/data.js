// Contenido fijo del seed: reproduce el prototipo. Las fechas y los números al azar los arma seed/index.js.

// Placeholder https hasta que haya imágenes reales en Cloudinary.
const placeholder = (hex, label) => ({
  url: `https://placehold.co/1200x800/${hex}/F8F4EE/png?text=${encodeURIComponent(label)}`,
  publicId: `seed/${label.toLowerCase().replace(/\W+/g, '-')}`,
});

// También es el perfil que devuelve GET /api/profile mientras el admin no guarde uno propio.
export const defaultProfile = {
  name: 'Martina Arce',
  title: 'Desarrolladora Fullstack',
  phrase: 'Productos web de punta a punta.',
  bio: 'Trabajo con pymes, startups y estudios que necesitan un sistema web completo: el backend que guarda y protege los datos, la API que los ordena y la interfaz que la gente usa todos los días.',
  email: 'hola@arce.dev',
  location: 'Salta, Argentina · remoto',
  github: 'https://github.com/martinaarce',
  linkedin: 'https://linkedin.com/in/martinaarce',
  photo: null,
  stack: ['React', 'React Router', 'Vite', 'Bootstrap', 'Node.js', 'Express', 'MongoDB', 'JWT'],
  experience: [
    { period: '2024 — HOY', role: 'Desarrolladora fullstack independiente', detail: 'Sistemas a medida para pymes de Salta y Jujuy.' },
    { period: '2021 — 2024', role: 'Desarrolladora backend en un estudio de software', detail: 'APIs REST y bases de datos.' },
    { period: '2016 — 2021', role: 'Ingeniería en Informática · UCASAL', detail: 'Formación en desarrollo de software.' },
  ],
};

export const services = [
  { name: 'Desarrollo web a medida', description: 'Sitios y aplicaciones completas, del diseño al despliegue.', color: '#9B1B22', priceFrom: 300000 },
  { name: 'APIs REST', description: 'Diseño e implementación de APIs seguras y documentadas.', color: '#160F10', priceFrom: 200000 },
  { name: 'Bases de datos', description: 'Modelado y optimización de bases SQL y MongoDB.', color: '#8A5A35', priceFrom: 150000 },
  { name: 'Asesoría técnica', description: 'Revisión de código, arquitectura y buenas prácticas.', color: '#4F6B3E', priceFrom: 50000 },
];

// daysAgo: antigüedad del proyecto. El último es el borrador.
export const projects = [
  {
    title: 'Gestor de turnos',
    summary: 'Reservas online con roles y avisos por email.',
    problem: 'Un consultorio de Salta tomaba los turnos por teléfono y en un cuaderno. Los pacientes olvidaban sus citas y la secretaria pasaba la mañana confirmando horarios.',
    solution: 'Una aplicación web donde el paciente elige día y horario, recibe la confirmación por email y un recordatorio el día anterior. El consultorio administra agendas, profesionales y feriados desde un panel con roles.',
    highlights: [
      'API REST en Express con validación de cada campo.',
      'Autenticación con JWT y roles de paciente, secretaria y administrador.',
      'Recordatorios automáticos por email con Nodemailer.',
      'Base de datos MongoDB con turnos e historial anidados.',
    ],
    role: 'Diseño, backend y frontend',
    duration: '8 semanas',
    stack: ['React', 'Node', 'MongoDB'],
    images: [placeholder('9B1B22', 'Gestor de turnos'), placeholder('160F10', 'Agenda'), placeholder('5E5550', 'Panel')],
    demoUrl: 'https://turnos.arce.dev',
    repoUrl: 'https://github.com/martinaarce/turnos',
    featured: true,
    visible: true,
    daysAgo: 75,
  },
  {
    title: 'Dashboard de ventas',
    summary: 'Métricas con filtros por fecha y gráficos.',
    problem: 'Una distribuidora llevaba las ventas en planillas sueltas y recién veía los números a fin de mes.',
    solution: 'Un panel con ventas por día, por producto y por vendedor, con filtros por rango de fechas y gráficos que se actualizan al instante.',
    highlights: ['Consultas con agregaciones de MongoDB.', 'Gráficos interactivos con Chart.js.', 'Exportación de los datos filtrados a CSV.'],
    role: 'Backend y frontend',
    duration: '5 semanas',
    stack: ['React', 'Chart.js'],
    images: [placeholder('160F10', 'Dashboard de ventas'), placeholder('5E5550', 'Gráficos')],
    demoUrl: 'https://ventas.arce.dev',
    repoUrl: 'https://github.com/martinaarce/ventas',
    featured: true,
    visible: true,
    daysAgo: 60,
  },
  {
    title: 'Tienda online',
    summary: 'Carrito, pagos y control de stock.',
    problem: 'Un emprendimiento de cerámica vendía solo por mensajes y perdía pedidos por no saber qué stock quedaba.',
    solution: 'Una tienda con carrito, pagos online y stock que se descuenta solo, con un panel para cargar productos y ver los pedidos.',
    highlights: ['Carrito persistente por usuario.', 'Descuento de stock sin ventas duplicadas.', 'Panel de pedidos con estados.'],
    role: 'Diseño, backend y frontend',
    duration: '10 semanas',
    stack: ['Express', 'MongoDB'],
    images: [placeholder('8A5A35', 'Tienda online')],
    demoUrl: 'https://tienda.arce.dev',
    repoUrl: 'https://github.com/martinaarce/tienda',
    featured: true,
    visible: true,
    daysAgo: 45,
  },
  {
    title: 'Clima en vivo',
    summary: 'Pronóstico con una API externa.',
    problem: 'Quería practicar el consumo de APIs de terceros con datos que cambian todo el tiempo.',
    solution: 'Una app que pide el pronóstico a una API pública, lo guarda en caché unos minutos y lo muestra con gráficos de temperatura y lluvia.',
    highlights: ['Consumo de una API externa con Fetch.', 'Caché para no repetir pedidos.', 'Gráficos de temperatura con Chart.js.'],
    role: 'Frontend',
    duration: '2 semanas',
    stack: ['Fetch', 'Chart.js'],
    images: [placeholder('4F6B3E', 'Clima en vivo'), placeholder('7A5A12', 'Pronóstico')],
    demoUrl: 'https://clima.arce.dev',
    repoUrl: 'https://github.com/martinaarce/clima',
    featured: false,
    visible: true,
    daysAgo: 38,
  },
  {
    title: 'Landing animada',
    summary: 'Animaciones al hacer scroll.',
    problem: 'Una landing estática no mostraba el producto y la gente se iba sin llegar a la mitad de la página.',
    solution: 'Una landing con animaciones que acompañan el scroll, pensadas para guiar la lectura y respetar a quien desactiva el movimiento.',
    highlights: ['Animaciones con anime.js.', 'Aparición de secciones con Intersection Observer.', 'Respeta la preferencia de reducir movimiento.'],
    role: 'Diseño y frontend',
    duration: '3 semanas',
    stack: ['anime.js'],
    images: [placeholder('5E5550', 'Landing animada')],
    demoUrl: 'https://landing.arce.dev',
    repoUrl: 'https://github.com/martinaarce/landing',
    featured: false,
    visible: true,
    daysAgo: 30,
  },
  {
    title: 'Blog con CMS',
    summary: 'Editor y panel de publicación.',
    problem: 'Un estudio de arquitectura quería publicar artículos sin pedirle cada cambio a un desarrollador.',
    solution: 'Un blog con editor de texto, borradores y un panel de publicación. Todavía está en desarrollo, por eso no tiene demo.',
    highlights: ['Editor con vista previa.', 'Borradores y publicación programada.'],
    role: 'Backend y frontend',
    duration: 'En curso',
    stack: ['React', 'Express'],
    images: [placeholder('7A5A12', 'Blog con CMS')],
    demoUrl: null,
    repoUrl: 'https://github.com/martinaarce/blog',
    featured: false,
    visible: false,
    daysAgo: 28,
  },
];

// Cuentas con nombre propio en la pantalla Usuarios del prototipo.
export const namedUsers = [
  { name: 'Valentina Ríos', email: 'valentina@correo.com', google: true, thisMonth: true },
  { name: 'Lucía Gómez', email: 'lucia@ejemplo.com', thisMonth: true },
  { name: 'Mateo Fernández', email: 'mateo@ejemplo.com', google: true, thisMonth: true },
  { name: 'Julieta Sosa', email: 'julieta@ejemplo.com', active: false },
  { name: 'Nicolás Pérez', email: 'nicolas@ejemplo.com' },
];

export const firstNames = ['Camila', 'Tomás', 'Sofía', 'Juan', 'Agustina', 'Franco', 'Milagros', 'Lautaro', 'Florencia', 'Santiago', 'Carolina', 'Facundo', 'Paula', 'Matías', 'Daniela', 'Gonzalo'];
export const lastNames = ['Romero', 'Sosa', 'López', 'Díaz', 'Torres', 'Acosta', 'Herrera', 'Medina', 'Aguirre', 'Castro', 'Flores', 'Rojas', 'Vega', 'Ortiz', 'Molina', 'Benítez'];

// Consultas de ejemplo por tipo. Las primeras de cada lista salen del prototipo.
export const inquiryPools = {
  cotizacion: [
    { subject: 'Tienda online para mi emprendimiento', message: 'Vendo cerámica artesanal y quiero una tienda con carrito y pagos. ¿Cuánto costaría y cuánto tiempo llevaría?' },
    { subject: 'Sistema de turnos para consultorio', message: 'Necesito que mis pacientes saquen turno online y reciban un recordatorio por email.' },
    { subject: 'Sitio institucional para mi estudio', message: 'Somos un estudio contable de cuatro personas y queremos un sitio con servicios, equipo y formulario de contacto.' },
    { subject: 'Panel para controlar el stock', message: 'Tenemos un local de repuestos y queremos un sistema simple para llevar el stock y avisar cuando algo se agota.' },
    { subject: 'App de reservas para un camping', message: 'Queremos que los turistas reserven parcelas desde el celular y paguen una seña. ¿Es algo que hacés?' },
    { subject: 'Rediseño de nuestra web', message: 'La web actual es lenta y no se ve bien en celulares. Queremos rehacerla manteniendo el contenido que ya tenemos.' },
    { subject: 'Sistema de gestión de alumnos', message: 'Damos clases particulares y necesitamos llevar asistencia, pagos y materiales por alumno en un solo lugar.' },
    { subject: 'Catálogo online con consulta por WhatsApp', message: 'Queremos mostrar nuestros productos en una web y que la gente consulte directo por WhatsApp.' },
  ],
  general: [
    { subject: 'Consulta sobre mantenimiento', message: '¿Ofrecés mantenimiento mensual para sitios ya publicados? Tenemos uno hecho hace dos años.' },
    { subject: 'Disponibilidad para noviembre', message: '¿Tenés disponibilidad para empezar un proyecto en noviembre? Es algo mediano y con fecha de entrega.' },
    { subject: 'Trabajás con equipos?', message: 'Armamos un equipo chico y buscamos alguien que se sume por proyecto. ¿Te interesaría charlarlo?' },
    { subject: 'Consulta por stack de tecnologías', message: 'Vi tu portfolio y me gustaría saber con qué tecnologías trabajás más y si hacés proyectos con Python.' },
    { subject: 'Pregunta sobre el proceso de trabajo', message: '¿Cómo es el proceso desde que te contacto hasta que me entregás el sistema? ¿Hay reuniones de avance?' },
    { subject: 'Colaboración en un proyecto abierto', message: 'Estamos armando una herramienta de código abierto para escuelas y nos vendría bien tu mirada de backend.' },
  ],
  asesoria: [
    { subject: 'Revisión de arquitectura de API', message: 'Tenemos una API en Express que se volvió lenta. ¿Podrías revisar cómo está armada y decirnos qué mejorar?' },
    { subject: 'Migrar de SQL a MongoDB', message: 'Queremos evaluar si conviene pasar nuestra base a MongoDB. Tenemos unas veinte tablas con relaciones.' },
    { subject: 'Migrar mi base a MongoDB', message: 'Mi sistema usa MySQL y las consultas están cada vez más lentas. ¿Vale la pena migrar a una base documental?' },
    { subject: 'Seguridad de nuestra aplicación', message: 'Antes de lanzar queremos que alguien revise el login, los permisos y cómo guardamos las contraseñas.' },
    { subject: 'Revisión de código de mi proyecto final', message: 'Estoy terminando un proyecto en React y Node y quisiera una revisión de la estructura y las buenas prácticas.' },
  ],
};

export const replyTexts = [
  'Hola, gracias por escribir. Te paso una propuesta con tiempos y costos estimados. ¿Te queda bien una videollamada de 20 minutos esta semana para ajustar los detalles?',
  'Gracias por la consulta. Es el tipo de proyecto que hago seguido. Te cuento cómo lo encararía y qué necesitaría de tu lado para arrancar.',
  'Hola, qué bueno que escribas. Revisé lo que me contás y tengo algunas preguntas antes de darte un presupuesto. ¿Podés pasarme más detalles?',
  'Gracias por contactarme. Sí, puedo ayudarte con eso. Te dejo los pasos que sugiero y una estimación de tiempo para cada uno.',
];
