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
  const { user, notify } = useApp();
  const [convs, setConvs] = useState(null), [cur, setCur] = useState(null), [msgs, setMsgs] = useState([]), [text, setText] = useState('');
  const [conversationError, setConversationError] = useState(''), [conversationRetry, setConversationRetry] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState(false), [messageStatus, setMessageStatus] = useState('');
  const [messageRetry, setMessageRetry] = useState(0), [sending, setSending] = useState(false);
  const messagesPane = useRef(), lastMessageId = useRef(null), shouldAutoScroll = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setConvs(null);
    setConversationError('');
    api('/conversations', { signal: controller.signal })
      .then((data) => {
        if (!active) return;
        setConvs(data);
        setCur(data[0]?._id || null);
      })
      .catch((error) => {
        if (active && error.name !== 'AbortError') setConversationError('Could not load your conversations.');
      });
    return () => { active = false; controller.abort(); };
  }, [conversationRetry]);

  useEffect(() => {
    if (!cur) {
      setMsgs([]);
      setLoadingMessages(false);
      return;
    }

    const controller = new AbortController();
    let active = true, timer, loaded = false;
    lastMessageId.current = null;
    shouldAutoScroll.current = true;
    setMsgs([]);
    setLoadingMessages(true);
    setMessageStatus('');

    const pull = async () => {
      try {
        const after = loaded ? lastMessageId.current : null;
        const path = `/conversations/${cur}/messages${after ? `?after=${encodeURIComponent(after)}` : ''}`;
        const incoming = await api(path, { signal: controller.signal });
        if (!active) return;

        if (!loaded) {
          loaded = true;
          lastMessageId.current = incoming[incoming.length - 1]?._id || null;
          shouldAutoScroll.current = true;
          setMsgs(incoming);
          setLoadingMessages(false);
        } else if (incoming.length) {
          const pane = messagesPane.current;
          shouldAutoScroll.current = Boolean(pane && pane.scrollHeight - pane.scrollTop - pane.clientHeight < 80);
          const latestId = incoming[incoming.length - 1]._id;
          if (!lastMessageId.current || latestId > lastMessageId.current) lastMessageId.current = latestId;
          setMsgs((current) => {
            const known = new Set(current.map((message) => message._id));
            const additions = incoming.filter((message) => !known.has(message._id));
            return additions.length ? [...current, ...additions] : current;
          });
          const latest = incoming[incoming.length - 1];
          setConvs((current) => current?.map((conversation) =>
            conversation._id === cur ? { ...conversation, lastMessage: latest.text } : conversation,
          ) || current);
        }
        setMessageStatus('');
      } catch (error) {
        if (!active || error.name === 'AbortError') return;
        setMessageStatus(loaded ? 'Connection interrupted. Retrying…' : 'Could not load messages. Retrying…');
        if (!loaded) setLoadingMessages(false);
      } finally {
        if (active && !controller.signal.aborted) timer = setTimeout(pull, 5000);
      }
    };

    pull();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [cur, messageRetry]);

  useEffect(() => {
    if (!shouldAutoScroll.current) return;
    messagesPane.current?.scrollTo({ top: messagesPane.current.scrollHeight, behavior: 'smooth' });
    shouldAutoScroll.current = false;
  }, [msgs]);

  const send = async (e) => {
    e.preventDefault();
    const message = text.trim();
    if (!message || !cur || sending) return;
    setSending(true);
    try {
      const sent = await api(`/conversations/${cur}/messages`, { method: 'POST', body: { text: message } });
      if (!lastMessageId.current || sent._id > lastMessageId.current) lastMessageId.current = sent._id;
      shouldAutoScroll.current = true;
      setMsgs((current) => current.some((item) => item._id === sent._id) ? current : [...current, sent]);
      setConvs((current) => current?.map((conversation) =>
        conversation._id === cur ? { ...conversation, lastMessage: sent.text } : conversation,
      ) || current);
      setText('');
    } catch (error) { notify(error.message, true); }
    finally { setSending(false); }
  };

  if (!convs && conversationError) return <Empty title="Couldn't load messages" hint={conversationError}><button className="btn" onClick={() => setConversationRetry((retry) => retry + 1)}>Try again</button></Empty>;
  if (!convs) return <Skeletons n={2} />;
  if (!convs.length) return <Empty title="No messages yet" hint="Message a seller from any listing to start a conversation."><Link to="/explore" className="btn">Explore listings</Link></Empty>;
  return (
    <div className="grid gap-4 md:grid-cols-[260px_1fr]">
      <ul className="space-y-2">{convs.map((c) => { const o = c.buyer._id === user.id ? c.seller : c.buyer; return (
        <li key={c._id}><button disabled={sending} onClick={() => setCur(c._id)} className={`w-full rounded-lg p-3 text-left disabled:opacity-70 ${cur === c._id ? 'bg-sea text-white' : 'bg-white'}`}><p className="font-medium">{o.name}</p><p className="truncate text-sm opacity-80">{c.product?.title}</p><p className="truncate text-sm opacity-70">{c.lastMessage}</p></button></li>); })}</ul>
      <div className="flex h-96 flex-col rounded-xl bg-white p-3 shadow-sm">
        <div ref={messagesPane} className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {loadingMessages ? <p className="text-sm text-slate-500">Loading messages…</p> : msgs.map((m) => <div key={m._id} className={`max-w-[75%] rounded-lg px-3 py-2 ${m.sender === user.id ? 'ml-auto bg-sea text-white' : 'bg-slate-100'}`}>{m.text}</div>)}
          {messageStatus && <p role="status" className="text-center text-xs text-slate-500">{messageStatus}</p>}
        </div>
        <form onSubmit={send} className="mt-2 flex gap-2">
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply" maxLength={1000} disabled={sending} />
          <button className="btn" disabled={!text.trim() || sending}>{sending ? 'Sending…' : 'Send'}</button>
        </form>
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
