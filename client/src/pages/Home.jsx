import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, CATEGORIES } from '../api.js';
import Card, { Empty, Skeletons } from '../components/Card.jsx';

export default function Home() {
  const nav = useNavigate(), [q, setQ] = useState(''), [items, setItems] = useState(null), [deals, setDeals] = useState(null);
  useEffect(() => {
    api('/products?limit=8&sort=newest').then((d) => setItems(d.items)).catch(() => setItems([]));
    api('/products?limit=4&sort=low').then((d) => setDeals(d.items)).catch(() => setDeals([]));
  }, []);
  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-ink px-6 py-14 text-white md:px-12">
        <h1 className="max-w-xl text-4xl font-extrabold md:text-5xl">Someone nearby is selling what you need.</h1>
        <form onSubmit={(e) => { e.preventDefault(); nav(`/explore?q=${encodeURIComponent(q)}`); }} className="mt-8 flex max-w-xl gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bikes, laptops, sofas…" aria-label="Search listings" className="input text-ink" />
          <button className="btn">Search</button>
        </form>
      </section>
      <section id="categories">
        <h2 className="mb-4 text-2xl font-bold">Browse by category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map((c) => <Link key={c} to={`/explore?category=${encodeURIComponent(c)}`} className="rounded-xl bg-white p-4 font-medium shadow-sm transition hover:bg-sea hover:text-white">{c}</Link>)}
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-2xl font-bold">Recently listed</h2>
        {!items ? <Skeletons /> : items.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{items.map((p) => <Card key={p._id} p={p} />)}</div>
          : <Empty title="No listings yet" hint="Be the first to sell something."><Link to="/sell" className="btn">Create a listing</Link></Empty>}
      </section>
      {deals?.length > 0 && <section>
        <h2 className="mb-4 text-2xl font-bold">Lowest prices</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{deals.map((p) => <Card key={p._id} p={p} />)}</div>
      </section>}
    </div>
  );
}
