// 🎨 DUEÑO: Integrante A (diseño y animación) · B (contenido)
import { TituloAnimado, CodigoQueSeEscribe } from '../../animations'; // Ajustá la ruta si hace falta

export default function Hero() {
  return (
    <section id="hero" className="container py-5 min-vh-100 d-flex align-items-center">
      <div className="row align-items-center w-100">
        
        {/* Columna de texto */}
        <div className="col-lg-6 mb-5 mb-lg-0 text-center text-lg-start">
          <p className="fs-4 text-muted mb-2">Hola, soy tu nombre</p>
          <h1 className="display-4 fw-bold mb-3">
            Desarrollador Fullstack
          </h1>
          
          {/* Animación de Gimena */}
          <TituloAnimado texto="Productos web" resaltado="de punta a punta." />
          
          <p className="lead mt-4 mb-4 text-secondary">
            Construyo aplicaciones a medida, escalables y enfocadas en la experiencia del usuario.
          </p>
          
          <div className="d-flex gap-3 justify-content-center justify-content-lg-start mt-4">
            <a href="#proyectos" className="btn btn-primary btn-lg px-4 shadow-sm">
              Ver proyectos
            </a>
            <a href="#contacto" className="btn btn-outline-primary btn-lg px-4">
              Contactar
            </a>
          </div>
        </div>

        {/* Columna de la animación de código */}
        <div className="col-lg-6 d-flex justify-content-center justify-content-lg-end">
          <CodigoQueSeEscribe />
        </div>
        
      </div>
    </section>
  );
}
