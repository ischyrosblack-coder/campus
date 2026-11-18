import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, CATEGORIES, CONDITIONS } from '../api.js';
import { useApp } from '../ctx.jsx';

export default function Sell() {
  const { id } = useParams(), nav = useNavigate(), { user, notify } = useApp();
  const [f, setF] = useState({ title: '', description: '', price: '', category: CATEGORIES[0], condition: CONDITIONS[0], location: user?.location || '', contact: user?.phone || '' });
  const [files, setFiles] = useState([]), [busy, setBusy] = useState(false);
  useEffect(() => { if (id) api('/products/' + id).then(({ product: p }) => setF({ title: p.title, description: p.description, price: p.price, category: p.category, condition: p.condition, location: p.location, contact: p.contact || '' })).catch((e) => notify(e.message, true)); }, [id]);
  const bind = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    const form = new FormData(); Object.entries(f).forEach(([k, v]) => form.append(k, v)); files.forEach((x) => form.append('images', x));
    try { const p = await api(id ? '/products/' + id : '/products', { method: id ? 'PUT' : 'POST', form }); notify(id ? 'Changes saved' : 'Listing published'); nav('/product/' + p._id); }
    catch (er) { notify(er.message, true); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-3 rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-extrabold">{id ? 'Edit listing' : 'Sell an item'}</h1>
      <input className="input" placeholder="What are you selling?" required maxLength={100} {...bind('title')} />
      <textarea className="input" rows={4} placeholder="Describe the item, its age and any flaws" required maxLength={2000} {...bind('description')} />
      <div className="grid grid-cols-2 gap-3">
        <input className="input" type="number" min="0" placeholder="Price (₹)" required {...bind('price')} />
        <select className="input" {...bind('condition')}>{CONDITIONS.map((c) => <option key={c}>{c}</option>)}</select>
        <select className="input" {...bind('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        <input className="input" placeholder="Location" required {...bind('location')} />
      </div>
      <input className="input" placeholder="Contact phone or email (optional)" {...bind('contact')} />
      <label className="block text-sm">Photos (up to 6, 5 MB each){id && ' – new photos are added to existing ones'}
        <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files].slice(0, 6))} className="mt-1 block w-full" />
      </label>
      {files.length > 0 && <div className="flex gap-2">{files.map((x, i) => <img key={i} alt="" src={URL.createObjectURL(x)} className="h-16 w-16 rounded object-cover" />)}</div>}
      <button className="btn w-full" disabled={busy || (!id && !files.length)}>{busy ? 'Saving…' : id ? 'Save changes' : 'Publish listing'}</button>
    </form>
  );
}
