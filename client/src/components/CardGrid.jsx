// 🎨 DUEÑO: Integrante B — grilla que renderiza una lista de tarjetas.
//   <CardGrid items={proyectos} renderItem={(p) => <Card … />} />
export default function CardGrid({ items = [], renderItem, empty = 'No hay elementos para mostrar.' }) {
  if (items.length === 0) return <p className="text-muted">{empty}</p>
  return (
    <div className="row g-4">
      {items.map((item) => (
        <div key={item._id || item.id} className="col-12 col-sm-6 col-lg-4">
          {renderItem(item)}
        </div>
      ))}
    </div>
  )
}
