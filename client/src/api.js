// Backend URL comes from VITE_API_URL (set in Vercel for production).
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const CATEGORIES = ['Electronics', 'Vehicles', 'Furniture', 'Fashion', 'Books', 'Home & Garden', 'Sports', 'Other'];
export const CONDITIONS = ['New', 'Like New', 'Good', 'Used'];
export const money = (n) => '₹' + Number(n).toLocaleString('en-IN');

export async function api(path, { method = 'GET', body, form, signal } = {}) {
  const headers = {}, token = localStorage.getItem('token');
  if (token) headers.Authorization = 'Bearer ' + token;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + path, { method, headers, body: form || (body && JSON.stringify(body)), signal });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
