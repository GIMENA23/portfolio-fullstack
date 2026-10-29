// 🎨 DUEÑO: Integrante B — grilla que renderiza una lista de tarjetas.
//   <CardGrid items={proyectos} renderItem={(p) => <Card … />} />
export default function CardGrid({
  items = [],
  renderItem,
  empty = 'No hay elementos para mostrar.',
  columns = 3,
}) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="card border-0 shadow-sm bg-light text-center py-5 px-3 my-2">
        <div className="card-body">
          <p className="fs-3 mb-2" aria-hidden="true">📂</p>
          <p className="text-secondary mb-0">{empty}</p>
        </div>
      </div>
    )
  }

  const colClass =
    columns === 2
      ? 'col-12 col-md-6'
      : columns === 4
        ? 'col-12 col-sm-6 col-lg-3'
        : 'col-12 col-sm-6 col-lg-4'

  return (
    <div className="row g-4">
      {items.map((item, idx) => (
        <div key={item._id || item.id || idx} className={colClass}>
          {renderItem(item, idx)}
        </div>
      ))}
    </div>
  )
}