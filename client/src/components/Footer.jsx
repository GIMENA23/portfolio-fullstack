// 🎨 DUEÑO: Integrante B (estructura) · A (estilo)
// Pie del prototipo: franja negra con guarda fina arriba.
const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="pie mt-auto">
      <div className="guarda-fina" aria-hidden="true" />
      <div className="pie-inner">
        <span>© {YEAR} Martina Arce · arce.dev</span>
        <span>TFI Lenguajes IV · UCASAL</span>
      </div>
    </footer>
  )
}
