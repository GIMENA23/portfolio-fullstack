// 🎨 DUEÑO: Integrante A (diseño y animación) · B (contenido)
// Hero del prototipo (Main.dc.html): franja carmín, título que sube palabra por palabra y código que se escribe.
import { Link } from 'react-router-dom'
import { TituloAnimado, CodigoQueSeEscribe, GuardaTejida } from '../../animations'

const CODIGO = `router.post('/consultas',
  validar(reglasConsulta),
  async (req, res) => {
    const c = await Consulta.create(req.body)
    await enviarAviso(c)
    ok(res, c, 201)
  })`

export default function Hero() {
  return (
    <>
      <section id="hero" className="banda">
        <div className="sec-inner sec-inner-hero d-flex flex-wrap align-items-center gap-5">
          <div className="d-flex flex-column gap-4" style={{ flex: '1 1 480px', minWidth: 0 }}>
            <span className="rotulo">DESARROLLADORA FULLSTACK — SALTA, ARGENTINA</span>
            <TituloAnimado texto="Productos web" resaltado="de punta a punta." className="hero-titulo" />
            <p className="hero-texto">
              Soy Martina Arce. Diseño APIs, modelo bases de datos y construyo interfaces en React, con oficio y sin atajos.
            </p>
            <div className="d-flex flex-wrap gap-3">
              <Link to="/proyectos" className="btn btn-primary">Ver proyectos →</Link>
              <Link to="/contacto" className="btn btn-outline-light">Pedir cotización</Link>
            </div>
          </div>
          <div style={{ flex: '1 1 340px', minWidth: 0 }}>
            <CodigoQueSeEscribe codigo={CODIGO} archivo="api/consultas.js" />
          </div>
        </div>
      </section>
      <GuardaTejida alCargar />
    </>
  )
}
