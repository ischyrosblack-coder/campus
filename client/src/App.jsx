import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useApp } from './ctx.jsx';
import Home from './pages/Home.jsx';
import Explore from './pages/Explore.jsx';
import Product from './pages/Product.jsx';
import Sell from './pages/Sell.jsx';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';

const INFO = {
  about: ['About Swapyard', 'Swapyard connects people who want to sell things they no longer need with people nearby who want them. Listings are free.'],
  contact: ['Contact', 'Questions about an item? Message the seller from the listing page. For site issues, contact the site owner.'],
  terms: ['Terms of use', 'Only list items you own and are allowed to sell. Be honest about condition. Meet in public places and inspect items before paying.'],
  privacy: ['Privacy', 'We store your name, email, optional phone and location, and your listings and messages. Passwords are hashed. We never sell your data.'],
};
const Info = () => { const [t, b] = INFO[useParams().slug] || ['Not found', '']; return <div className="mx-auto max-w-xl py-10"><h1 className="mb-3 text-3xl font-extrabold">{t}</h1><p>{b}</p></div>; };

function Guard({ children }) {
  const { user, ready } = useApp();
  if (!ready) return <p className="p-10">Loading…</p>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, logout } = useApp();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);
  const link = ({ isActive }) => (isActive ? 'font-bold text-sea' : 'hover:text-sea');
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3">
          <Link to="/" className="mr-auto inline-flex items-center gap-2 font-display text-2xl font-extrabold text-sea">
            <img src="/favicon.svg" alt="" className="h-7 w-7" />
            Swapyard
          </Link>
          <NavLink to="/" end className={link}>Home</NavLink>
          <NavLink to="/explore" className={link}>Explore</NavLink>
          <a href="/#categories" className="hover:text-sea">Categories</a>
          <Link to="/sell" className="btn !py-1">Sell</Link>
          <button type="button" onClick={() => setDarkMode((dark) => !dark)} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} className="btn-alt !px-2 !py-1">
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {darkMode
                ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>
                : <path d="M20.2 15.3A8.5 8.5 0 0 1 8.7 3.8 8.5 8.5 0 1 0 20.2 15.3Z" />}
            </svg>
          </button>
          {user ? <>
            <NavLink to="/dashboard" className={link}>Profile</NavLink>
            <button onClick={logout} className="hover:text-coral">Log out</button>
          </> : <NavLink to="/login" className={link}>Login</NavLink>}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth register />} />
          <Route path="/sell" element={<Guard><Sell /></Guard>} />
          <Route path="/edit/:id" element={<Guard><Sell /></Guard>} />
          <Route path="/dashboard" element={<Guard><Dashboard /></Guard>} />
          <Route path="/info/:slug" element={<Info />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <footer className="border-t bg-white py-6 text-sm text-slate-500">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-4 px-4">
          <span className="mr-auto">© {new Date().getFullYear()} Swapyard</span>
          {Object.keys(INFO).map((k) => <Link key={k} to={`/info/${k}`} className="capitalize hover:text-sea">{k}</Link>)}
        </div>
      </footer>
    </div>
  );
}
