// ⚙️ BASE DEL PROYECTO — marca las páginas que todavía no se hicieron.
// Cuando termines tu página, borrá el <Placeholder> de tu archivo.
export default function Placeholder({ owner, title, todo = [] }) {
  return (
    <div className="placeholder-box my-4">
      <div className="small text-uppercase text-muted mb-1">Pendiente · {owner}</div>
      <h2 className="h4">{title}</h2>
      {todo.length > 0 && (
        <ul className="mb-0">
          {todo.map((t) => <li key={t}>{t}</li>)}
        </ul>
      )}
    </div>
  )
}
