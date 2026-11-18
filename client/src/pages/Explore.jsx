import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, CATEGORIES, CONDITIONS } from '../api.js';
import Card, { Empty, Skeletons } from '../components/Card.jsx';

export default function Explore() {
  const [sp, setSp] = useSearchParams(), [data, setData] = useState(null), [err, setErr] = useState('');
  const set = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); if (k !== 'page') n.delete('page'); setSp(n); };
  useEffect(() => { setData(null); setErr(''); api('/products?' + sp.toString()).then(setData).catch((e) => setErr(e.message)); }, [sp]);
  const page = +sp.get('page') || 1;
  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <aside key={sp.toString() === '' ? 'clear' : 'f'} className="space-y-3 rounded-xl bg-white p-4 shadow-sm md:self-start">
        <input className="input" placeholder="Search" aria-label="Search" defaultValue={sp.get('q') || ''} onKeyDown={(e) => e.key === 'Enter' && set('q', e.target.value)} onBlur={(e) => e.target.value !== (sp.get('q') || '') && set('q', e.target.value)} />
        <select className="input" aria-label="Category" value={sp.get('category') || ''} onChange={(e) => set('category', e.target.value)}><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        <select className="input" aria-label="Condition" value={sp.get('condition') || ''} onChange={(e) => set('condition', e.target.value)}><option value="">Any condition</option>{CONDITIONS.map((c) => <option key={c}>{c}</option>)}</select>
        <div className="flex gap-2">
          <input className="input" type="number" min="0" placeholder="Min ₹" aria-label="Minimum price" defaultValue={sp.get('min') || ''} onBlur={(e) => e.target.value !== (sp.get('min') || '') && set('min', e.target.value)} />
          <input className="input" type="number" min="0" placeholder="Max ₹" aria-label="Maximum price" defaultValue={sp.get('max') || ''} onBlur={(e) => e.target.value !== (sp.get('max') || '') && set('max', e.target.value)} />
        </div>
        <select className="input" aria-label="Sort" value={sp.get('sort') || 'newest'} onChange={(e) => set('sort', e.target.value)}>
          <option value="newest">Newest</option><option value="oldest">Oldest</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option>
        </select>
        <button className="btn-alt w-full" onClick={() => setSp({})}>Clear filters</button>
      </aside>
      <section>
        {err ? <Empty title="Couldn't load listings" hint={err} /> : !data ? <Skeletons n={6} /> : data.items.length === 0
          ? <Empty title="No listings match" hint="Try removing a filter or searching for something else." />
          : <>
            <p className="mb-3 text-slate-500">{data.total} listing{data.total === 1 ? '' : 's'}</p>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{data.items.map((p) => <Card key={p._id} p={p} />)}</div>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button className="btn-alt" disabled={page <= 1} onClick={() => set('page', page - 1)}>Previous</button>
              <span>Page {page} of {data.pages}</span>
              <button className="btn-alt" disabled={page >= data.pages} onClick={() => set('page', page + 1)}>Next</button>
            </div></>}
      </section>
    </div>
  );
}
