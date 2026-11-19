import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const ref = (name, extra = {}) => ({ type: Schema.Types.ObjectId, ref: name, required: true, ...extra });

export const CATEGORIES = ['Electronics', 'Vehicles', 'Furniture', 'Fashion', 'Books', 'Home & Garden', 'Sports', 'Other'];
export const CONDITIONS = ['New', 'Like New', 'Good', 'Used'];

export const User = model('User', new Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^\S+@\S+\.\S+$/ },
  password: { type: String, required: true, select: false },
  avatar: String, phone: { type: String, maxlength: 30 }, location: { type: String, maxlength: 80 },
}, { timestamps: true }));

const productSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 2000 },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, enum: CATEGORIES, required: true },
  condition: { type: String, enum: CONDITIONS, required: true },
  location: { type: String, required: true, maxlength: 80 },
  contact: { type: String, maxlength: 100 },
  images: [String],
  seller: ref('User'),
  status: { type: String, enum: ['Available', 'Sold'], default: 'Available' },
}, { timestamps: true });
productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1, createdAt: -1 });
productSchema.index({ seller: 1 });
export const Product = model('Product', productSchema);

const fav = new Schema({ user: ref('User'), product: ref('Product') }, { timestamps: true });
fav.index({ user: 1, product: 1 }, { unique: true });
export const Favourite = model('Favourite', fav);

const conv = new Schema({ product: ref('Product'), buyer: ref('User'), seller: ref('User'), lastMessage: String }, { timestamps: true });
conv.index({ product: 1, buyer: 1 }, { unique: true });
export const Conversation = model('Conversation', conv);

const msg = new Schema({ conversation: ref('Conversation'), sender: ref('User'), text: { type: String, required: true, maxlength: 1000 } }, { timestamps: true });
msg.index({ conversation: 1, createdAt: 1 });
msg.index({ conversation: 1, _id: 1 });
export const Message = model('Message', msg);
