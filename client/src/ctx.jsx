import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';
const Ctx = createContext();
export const useApp = () => useContext(Ctx);

export function Provider({ children }) {
  const [user, setUser] = useState(null), [ready, setReady] = useState(false);
  const [favs, setFavs] = useState([]), [toast, setToast] = useState(null);
  const notify = (msg, bad) => { setToast({ msg, bad }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (!localStorage.getItem('token')) return setReady(true);
    api('/auth/me').then(setUser).catch(() => localStorage.removeItem('token')).finally(() => setReady(true));
  }, []);
  useEffect(() => { user ? api('/favourites').then((l) => setFavs(l.map((p) => p._id))).catch(() => {}) : setFavs([]); }, [user]);

  const login = (d) => { localStorage.setItem('token', d.token); setUser(d.user); };
  const logout = () => { localStorage.removeItem('token'); setUser(null); };
  const toggleFav = async (id) => {
    if (!user) return notify('Log in to save favourites', true);
    try { const { favourited } = await api('/favourites/' + id, { method: 'POST' }); setFavs((f) => favourited ? [...f, id] : f.filter((x) => x !== id)); }
    catch (e) { notify(e.message, true); }
  };
  return (
    <Ctx.Provider value={{ user, setUser, ready, login, logout, favs, toggleFav, notify }}>
      {children}
      {toast && <div role="status" className={`fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-white shadow-lg ${toast.bad ? 'bg-coral' : 'bg-ink'}`}>{toast.msg}</div>}
    </Ctx.Provider>
  );
}
