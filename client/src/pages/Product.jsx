import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, money } from '../api.js';
import { useApp } from '../ctx.jsx';
import Card, { Empty } from '../components/Card.jsx';

export default function Product() {
  const { id } = useParams(), nav = useNavigate(), { user, notify, favs, toggleFav } = useApp();
  const [d, setD] = useState(null), [err, setErr] = useState(''), [img, setImg] = useState(0), [text, setText] = useState('');
  const load = () => api('/products/' + id).then((x) => { setD(x); setImg(0); }).catch((e) => setErr(e.message));
  useEffect(() => { setD(null); setErr(''); load(); }, [id]);
  if (err) return <Empty title="Listing not found" hint={err} />;
  if (!d) return <div className="h-96 animate-pulse rounded-xl bg-slate-200" />;
  const { product: p, more } = d, mine = user?.id === p.seller._id;
  const send = async (msg) => {
    if (!user) return nav('/login');
    try { await api('/conversations', { method: 'POST', body: { productId: p._id, text: msg } }); notify('Message sent'); nav('/dashboard?tab=messages'); }
    catch (e) { notify(e.message, true); }
  };
  const status = async () => { try { await api(`/products/${p._id}/status`, { method: 'PATCH', body: { status: p.status === 'Sold' ? 'Available' : 'Sold' } }); load(); } catch (e) { notify(e.message, true); } };
  const del = async () => { if (!confirm('Delete this listing permanently?')) return; try { await api('/products/' + p._id, { method: 'DELETE' }); notify('Listing deleted'); nav('/dashboard'); } catch (e) { notify(e.message, true); } };
  return (
    <div className="space-y-10">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">{p.images[img] && <img src={p.images[img]} alt={p.title} className="h-full w-full object-cover" />}</div>
          <div className="mt-2 flex gap-2">{p.images.map((u, i) => <button key={u} onClick={() => setImg(i)} aria-label={`Photo ${i + 1}`}><img src={u} alt="" className={`h-16 w-16 rounded object-cover ${i === img ? 'ring-2 ring-sea' : ''}`} /></button>)}</div>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold">{p.title}</h1>
          <p className="font-display text-3xl font-bold text-sea">{money(p.price)} {p.status === 'Sold' && <span className="ml-2 rounded bg-ink px-2 py-0.5 align-middle text-sm text-white">Sold</span>}</p>
          <p className="text-slate-600">{p.category} · {p.condition} · {p.location}</p>
          <p className="whitespace-pre-line">{p.description}</p>
          {p.contact && <p className="text-sm">Contact: {p.contact}</p>}
          <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
            {p.seller.avatar ? <img src={p.seller.avatar} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-full bg-sea text-white">{p.seller.name[0]}</span>}
            <div><p className="font-medium">{p.seller.name}</p><p className="text-sm text-slate-500">Member since {new Date(p.seller.createdAt).getFullYear()}{p.seller.location && ` · ${p.seller.location}`}</p></div>
          </div>
          {mine ? (
            <div className="flex flex-wrap gap-2"><Link className="btn" to={'/edit/' + p._id}>Edit</Link><button className="btn-alt" onClick={status}>Mark as {p.status === 'Sold' ? 'available' : 'sold'}</button><button className="btn-alt text-coral" onClick={del}>Delete</button></div>
          ) : (
            <div className="space-y-2">
              <textarea className="input" rows={3} placeholder="Message the seller" value={text} onChange={(e) => setText(e.target.value)} />
              <div className="flex flex-wrap gap-2">
                <button className="btn" disabled={!text.trim()} onClick={() => send(text)}>Send message</button>
                <button className="btn-alt" onClick={() => send(`Hi, I'm interested in "${p.title}". Is it still available?`)}>I'm interested</button>
                <button className="btn-alt" onClick={() => toggleFav(p._id)}>{favs.includes(p._id) ? '♥ Saved' : '♡ Save'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {more.length > 0 && <section><h2 className="mb-3 text-xl font-bold">More from {p.seller.name}</h2><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{more.map((m) => <Card key={m._id} p={m} />)}</div></section>}
    </div>
  );
}
