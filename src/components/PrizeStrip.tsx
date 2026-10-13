const items = [
  { icon: '📱', title: '3 celulares', text: 'Los modelos se anunciarán próximamente.' },
  { icon: '🎟️', title: 'Totalmente gratis', text: 'No necesitas realizar ninguna compra.' },
  { icon: '☝️', title: 'Una participación', text: 'Un registro por persona.' },
]

export function PrizeStrip() {
  return (
    <section aria-label="Lo más importante" className="relative z-10 mx-auto -mt-2 max-w-5xl px-4 sm:px-6">
      <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {items.map((item) => (
          <li
            key={item.title}
            className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgb(30_118_186/0.14)] ring-1 ring-rincel-light-blue sm:flex-col sm:p-6 sm:text-center"
          >
            <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-2xl bg-rincel-light-blue text-3xl">
              {item.icon}
            </span>
            <div>
              <p className="text-lg font-black text-rincel-blue">{item.title}</p>
              <p className="text-sm font-semibold text-rincel-dark/75">{item.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
