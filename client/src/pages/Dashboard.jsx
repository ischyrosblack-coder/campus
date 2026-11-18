import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../ctx.jsx';
import Card, { Empty, Skeletons } from '../components/Card.jsx';

function Listings() {
  const { user, notify } = useApp(), [items, setItems] = useState(null);
  const load = () => api('/products?limit=50&seller=' + user.id).then((d) => setItems(d.items));
  useEffect(() => { load().catch((e) => notify(e.message, true)); }, []);
  const run = (fn) => fn().then(load).catch((e) => notify(e.message, true));
  const toggle = (p) => run(() => api(`/products/${p._id}/status`, { method: 'PATCH', body: { status: p.status === 'Sold' ? 'Available' : 'Sold' } }));
  const del = (p) => confirm(`Delete "${p.title}"?`) && run(async () => { await api('/products/' + p._id, { method: 'DELETE' }); notify('Listing deleted'); });
  if (!items) return <Skeletons n={4} />;
  if (!items.length) return <Empty title="You haven't listed anything" hint="Your listings will appear here."><Link to="/sell" className="btn">Sell an item</Link></Empty>;
  return <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{items.map((p) => <div key={p._id}><Card p={p} /><div className="mt-2 flex gap-2 text-sm"><Link className="btn-alt !py-1" to={'/edit/' + p._id}>Edit</Link><button className="btn-alt !py-1" onClick={() => toggle(p)}>{p.status === 'Sold' ? 'Relist' : 'Mark sold'}</button><button className="btn-alt !py-1 text-coral" onClick={() => del(p)}>Delete</button></div></div>)}</div>;
}

function Favourites() {
  const [items, setItems] = useState(null);
  useEffect(() => { api('/favourites').then(setItems).catch(() => setItems([])); }, []);
  if (!items) return <Skeletons n={4} />;
  return items.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{items.map((p) => <Card key={p._id} p={p} />)}</div> : <Empty title="No favourites yet" hint="Tap the heart on a listing to save it."><Link to="/explore" className="btn">Explore listings</Link></Empty>;
}

function Messages() {
  const { user, notify } = useApp(), [convs, setConvs] = useState(null), [cur, setCur] = useState(null), [msgs, setMsgs] = useState([]), [text, setText] = useState('');
  const end = useRef();
  useEffect(() => { api('/conversations').then((c) => { setConvs(c); if (c[0]) setCur(c[0]._id); }).catch((e) => notify(e.message, true)); }, []);
  useEffect(() => {
    if (!cur) return;
    const pull = () => api(`/conversations/${cur}/messages`).then(setMsgs).catch(() => {});
    pull(); const t = setInterval(pull, 5000); return () => clearInterval(t);
  }, [cur]);
  useEffect(() => end.current?.scrollIntoView(), [msgs]);
  const send = async (e) => { e.preventDefault(); if (!text.trim()) return; try { const m = await api(`/conversations/${cur}/messages`, { method: 'POST', body: { text } }); setMsgs([...msgs, m]); setText(''); } catch (er) { notify(er.message, true); } };
  if (!convs) return <Skeletons n={2} />;
  if (!convs.length) return <Empty title="No messages yet" hint="Message a seller from any listing to start a conversation."><Link to="/explore" className="btn">Explore listings</Link></Empty>;
  return (
    <div className="grid gap-4 md:grid-cols-[260px_1fr]">
      <ul className="space-y-2">{convs.map((c) => { const o = c.buyer._id === user.id ? c.seller : c.buyer; return (
        <li key={c._id}><button onClick={() => setCur(c._id)} className={`w-full rounded-lg p-3 text-left ${cur === c._id ? 'bg-sea text-white' : 'bg-white'}`}><p className="font-medium">{o.name}</p><p className="truncate text-sm opacity-80">{c.product?.title}</p><p className="truncate text-sm opacity-70">{c.lastMessage}</p></button></li>); })}</ul>
      <div className="flex h-96 flex-col rounded-xl bg-white p-3 shadow-sm">
        <div className="flex-1 space-y-2 overflow-y-auto">{msgs.map((m) => <div key={m._id} className={`max-w-[75%] rounded-lg px-3 py-2 ${m.sender === user.id ? 'ml-auto bg-sea text-white' : 'bg-slate-100'}`}>{m.text}</div>)}<div ref={end} /></div>
        <form onSubmit={send} className="mt-2 flex gap-2"><input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply" maxLength={1000} /><button className="btn">Send</button></form>
      </div>
    </div>
  );
}

function Profile() {
  const { user, setUser, notify } = useApp(), [f, setF] = useState({ name: user.name, phone: user.phone || '', location: user.location || '' }), [file, setFile] = useState(null);
  const save = async (e) => { e.preventDefault(); const form = new FormData(); Object.entries(f).forEach(([k, v]) => form.append(k, v)); if (file) form.append('avatar', file);
    try { setUser(await api('/auth/me', { method: 'PUT', form })); notify('Profile saved'); } catch (er) { notify(er.message, true); } };
  return (
    <form onSubmit={save} className="max-w-md space-y-3 rounded-xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">Signed in as {user.email}</p>
      <input className="input" placeholder="Name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input className="input" placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      <input className="input" placeholder="Location" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
      <label className="block text-sm">Profile picture<input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="mt-1 block" /></label>
      <button className="btn">Save changes</button>
    </form>
  );
}

const TABS = { listings: ['My listings', Listings], favourites: ['Favourites', Favourites], messages: ['Messages', Messages], profile: ['Profile', Profile] };
export default function Dashboard() {
  const [sp, setSp] = useSearchParams(), tab = TABS[sp.get('tab')] ? sp.get('tab') : 'listings', Body = TABS[tab][1];
  return (
    <div>
      <div className="mb-5 flex gap-2 overflow-x-auto">{Object.entries(TABS).map(([k, [l]]) => <button key={k} onClick={() => setSp({ tab: k })} className={`whitespace-nowrap rounded-full px-4 py-1.5 ${tab === k ? 'bg-ink text-white' : 'bg-white'}`}>{l}</button>)}</div>
      <Body key={tab} />
    </div>
  );
}
