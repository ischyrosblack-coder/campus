import { Router } from 'express';
import { Favourite, Product, Conversation, Message } from '../models/index.js';
import { protect, wrap } from '../middleware/auth.js';

const r = Router();
r.use(protect);

// ---- Favourites ----
r.get('/favourites', wrap(async (req, res) => {
  const favs = await Favourite.find({ user: req.user.id }).sort({ createdAt: -1 }).populate({ path: 'product', populate: { path: 'seller', select: 'name avatar' } });
  res.json(favs.map((f) => f.product).filter(Boolean));
}));

r.post('/favourites/:pid', wrap(async (req, res) => {
  if (!(await Product.exists({ _id: req.params.pid }))) return res.status(404).json({ message: 'Listing not found' });
  const q = { user: req.user.id, product: req.params.pid };
  const existing = await Favourite.findOneAndDelete(q);
  if (!existing) await Favourite.create(q);
  res.json({ favourited: !existing });
}));

// ---- Conversations ----
r.get('/conversations', wrap(async (req, res) => {
  const list = await Conversation.find({ $or: [{ buyer: req.user.id }, { seller: req.user.id }] }).sort({ updatedAt: -1 })
    .populate('product', 'title images').populate('buyer seller', 'name avatar');
  res.json(list);
}));

r.post('/conversations', wrap(async (req, res) => {
  const { productId, text } = req.body;
  const p = await Product.findById(productId);
  if (!p) return res.status(404).json({ message: 'Listing not found' });
  if (p.seller.equals(req.user.id)) return res.status(400).json({ message: 'This is your own listing' });
  if (!text?.trim()) return res.status(400).json({ message: 'Write a message first' });
  const c = (await Conversation.findOne({ product: p.id, buyer: req.user.id })) || (await Conversation.create({ product: p.id, buyer: req.user.id, seller: p.seller }));
  await Message.create({ conversation: c.id, sender: req.user.id, text: text.trim() });
  c.lastMessage = text.trim().slice(0, 100); await c.save();
  res.status(201).json(c);
}));

const member = async (req, res) => {
  const c = await Conversation.findById(req.params.id);
  if (!c || ![c.buyer, c.seller].some((x) => x.equals(req.user.id))) { res.status(404).json({ message: 'Conversation not found' }); return null; }
  return c;
};

r.get('/conversations/:id/messages', wrap(async (req, res) => {
  if (!(await member(req, res))) return;
  res.json(await Message.find({ conversation: req.params.id }).sort({ createdAt: 1 }).limit(500));
}));

r.post('/conversations/:id/messages', wrap(async (req, res) => {
  const c = await member(req, res); if (!c) return;
  if (!req.body.text?.trim()) return res.status(400).json({ message: 'Write a message first' });
  const m = await Message.create({ conversation: c.id, sender: req.user.id, text: req.body.text.trim() });
  c.lastMessage = m.text.slice(0, 100); await c.save();
  res.status(201).json(m);
}));

export default r;
