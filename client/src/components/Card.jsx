import { Link } from 'react-router-dom';
import { useApp } from '../ctx.jsx';
import { money } from '../api.js';

export const Skeletons = ({ n = 8 }) => (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
    {Array.from({ length: n }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-xl bg-slate-200" />)}
  </div>
);
export const Empty = ({ title, hint, children }) => (
  <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center"><p className="font-display text-xl">{title}</p><p className="mb-4 text-slate-500">{hint}</p>{children}</div>
);

export default function Card({ p }) {
  const { favs, toggleFav } = useApp();
  const on = favs.includes(p._id);
  return (
    <Link to={`/product/${p._id}`} className="group relative block overflow-hidden rounded-xl bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="aspect-square bg-slate-100">
        {p.images?.[0] ? <img src={p.images[0]} alt={p.title} loading="lazy" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-slate-400">No image</div>}
      </div>
      {p.status === 'Sold' && <span className="absolute left-2 top-2 rounded bg-ink px-2 py-0.5 text-xs text-white">Sold</span>}
      <button aria-label="Save to favourites" onClick={(e) => { e.preventDefault(); toggleFav(p._id); }}
        className={`absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 ${on ? 'text-coral' : 'text-slate-500'}`}>{on ? '♥' : '♡'}</button>
      <div className="p-3">
        <p className="font-display text-lg font-bold text-sea">{money(p.price)}</p>
        <p className="truncate">{p.title}</p>
        <p className="truncate text-sm text-slate-500">{p.location} · {p.condition}</p>
      </div>
    </Link>
  );
}
