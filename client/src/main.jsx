import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { Provider } from './ctx.jsx';
import './index.css';
document.documentElement.classList.toggle('dark', localStorage.getItem('theme') === 'dark');
createRoot(document.getElementById('root')).render(<BrowserRouter><Provider><App /></Provider></BrowserRouter>);
