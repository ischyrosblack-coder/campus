import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../ctx.jsx';

export default function Auth({ register }) {
  const { user, login, notify } = useApp(), nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '' }), [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { login(await api(register ? '/auth/register' : '/auth/login', { method: 'POST', body: f })); nav('/dashboard'); }
    catch (er) { notify(er.message, true); } finally { setBusy(false); }
  };
  const bind = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) });
  return (
    <form onSubmit={submit} className="mx-auto mt-6 max-w-sm space-y-3 rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-extrabold">{register ? 'Create your account' : 'Log in'}</h1>
      {register && <input className="input" placeholder="Full name" required {...bind('name')} />}
      <input className="input" type="email" placeholder="Email" required {...bind('email')} />
      <input className="input" type="password" placeholder="Password (6+ characters)" minLength={6} required {...bind('password')} />
      <button className="btn w-full" disabled={busy}>{busy ? 'Please wait…' : register ? 'Sign up' : 'Log in'}</button>
      <p className="text-sm text-slate-500">{register ? 'Already registered?' : 'New here?'} <Link className="text-sea underline" to={register ? '/login' : '/register'}>{register ? 'Log in' : 'Create an account'}</Link></p>
    </form>
  );
}
