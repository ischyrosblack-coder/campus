import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { protect, sign, wrap } from '../middleware/auth.js';
import { upload, uploadImages } from '../middleware/upload.js';

const r = Router();
const clean = (u) => ({ id: u.id, name: u.name, email: u.email, avatar: u.avatar, phone: u.phone, location: u.location });

r.post('/register', wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: 'Name, email and a password of 6+ characters are required' });
  if (await User.findOne({ email: String(email).toLowerCase() })) return res.status(409).json({ message: 'That email is already registered' });
  const u = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
  res.status(201).json({ token: sign(u.id), user: clean(u) });
}));

r.post('/login', wrap(async (req, res) => {
  const u = await User.findOne({ email: String(req.body.email || '').toLowerCase() }).select('+password');
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password))) return res.status(401).json({ message: 'Incorrect email or password' });
  res.json({ token: sign(u.id), user: clean(u) });
}));

r.get('/me', protect, (req, res) => res.json(clean(req.user)));

r.put('/me', protect, upload.single('avatar'), wrap(async (req, res) => {
  for (const k of ['name', 'phone', 'location']) if (req.body[k] !== undefined) req.user[k] = req.body[k];
  if (req.file) req.user.avatar = (await uploadImages([req.file]))[0];
  await req.user.save();
  res.json(clean(req.user));
}));

export default r;
