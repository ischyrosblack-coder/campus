import { Router } from 'express';
import { Product } from '../models/index.js';
import { protect, wrap } from '../middleware/auth.js';
import { upload, uploadImages } from '../middleware/upload.js';

const r = Router();
const FIELDS = ['title', 'description', 'price', 'category', 'condition', 'location', 'contact'];
const pick = (b) => Object.fromEntries(FIELDS.filter((k) => b[k] !== undefined).map((k) => [k, b[k]]));

r.get('/', wrap(async (req, res) => {
  const { q, category, condition, min, max, sort, seller, page = 1, limit = 12 } = req.query;
  const f = {};
  if (q) f.$text = { $search: String(q) };
  if (category) f.category = String(category);
  if (condition) f.condition = String(condition);
  if (seller) f.seller = String(seller);
  if (min || max) f.price = { ...(min && { $gte: +min }), ...(max && { $lte: +max }) };
  const order = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, low: { price: 1 }, high: { price: -1 } }[sort] || { createdAt: -1 };
  const lim = Math.min(+limit || 12, 50), skip = (Math.max(+page, 1) - 1) * lim;
  const [items, total] = await Promise.all([
    Product.find(f).sort(order).skip(skip).limit(lim).populate('seller', 'name avatar'),
    Product.countDocuments(f),
  ]);
  res.json({ items, total, pages: Math.ceil(total / lim) });
}));

r.get('/:id', wrap(async (req, res) => {
  const p = await Product.findById(req.params.id).populate('seller', 'name avatar phone location createdAt');
  if (!p) return res.status(404).json({ message: 'Listing not found' });
  const more = await Product.find({ seller: p.seller._id, _id: { $ne: p._id } }).sort({ createdAt: -1 }).limit(4).populate('seller', 'name avatar');
  res.json({ product: p, more });
}));

r.post('/', protect, upload.array('images', 6), wrap(async (req, res) => {
  const data = pick(req.body);
  const images = await uploadImages(req.files);
  if (!images.length) return res.status(400).json({ message: 'Add at least one image' });
  const p = await Product.create({ ...data, images, seller: req.user.id });
  res.status(201).json(p);
}));

const owned = async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) { res.status(404).json({ message: 'Listing not found' }); return null; }
  if (!p.seller.equals(req.user.id)) { res.status(403).json({ message: 'You can only change your own listings' }); return null; }
  return p;
};

r.put('/:id', protect, upload.array('images', 6), wrap(async (req, res) => {
  const p = await owned(req, res); if (!p) return;
  Object.assign(p, pick(req.body));
  const added = await uploadImages(req.files);
  p.images = [...p.images, ...added].slice(0, 6);
  await p.save();
  res.json(p);
}));

r.patch('/:id/status', protect, wrap(async (req, res) => {
  const p = await owned(req, res); if (!p) return;
  if (!['Available', 'Sold'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid status' });
  p.status = req.body.status; await p.save(); res.json(p);
}));

r.delete('/:id', protect, wrap(async (req, res) => {
  const p = await owned(req, res); if (!p) return;
  await p.deleteOne(); res.json({ ok: true });
}));

export default r;
