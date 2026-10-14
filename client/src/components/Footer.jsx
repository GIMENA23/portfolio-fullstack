// 🎨 DUEÑO: Integrante B (estructura) · A (estilo)
const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="border-top py-4 mt-5">
      <div className="container d-flex flex-column flex-md-row justify-content-between gap-2 small text-muted">
        <span>© {YEAR} Portfolio Fullstack</span>
        <span>TFI Lenguajes IV · UCASAL</span>
      </div>
    </footer>
  )
}
