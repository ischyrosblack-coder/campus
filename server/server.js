import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import auth from './routes/auth.js';
import products from './routes/products.js';
import social from './routes/social.js';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim()) }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 400 }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 40 }));

app.get('/api/health', (req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }));
app.use('/api/auth', auth);
app.use('/api/products', products);
app.use('/api', social);
app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));

app.use((err, req, res, next) => {
  if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ message: err.message });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Each image must be under 5 MB' });
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

connectDB()
  .then(() => app.listen(process.env.PORT || 5000, () => console.log('API listening')))
  .catch((e) => { console.error('Startup failed:', e.message); process.exit(1); });
