# Swapyard – Buy & Sell Marketplace (MERN)

`client/` React + Vite + Tailwind → deploy on **Vercel**
`server/` Node + Express + MongoDB (Mongoose) → deploy on **Render**

Features: signup/login (JWT + bcrypt), listings with multi-image upload (Cloudinary), search/filter/sort/pagination, favourites,
buyer–seller messaging, mark sold/available, dashboard (listings, favourites, messages, profile), helmet + rate limiting + CORS, `/api/health`.

## Environment variables

| Variable | Where to set it | Value |
|---|---|---|
| `MONGODB_URI` | **Render** (and `server/.env` locally) | Atlas connection string |
| `JWT_SECRET` | **Render** | long random string (`render.yaml` can generate it) |
| `CLIENT_URL` | **Render** | your Vercel URL, no trailing slash, e.g. `https://myapp.vercel.app` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | **Render** | from the Cloudinary dashboard |
| `PORT` | local only | Render sets it automatically |
| `VITE_API_URL` | **Vercel** (and `client/.env` locally) | `https://<your-service>.onrender.com/api` |

The MongoDB connection code is in `server/config/db.js`; it only reads `MONGODB_URI`.

## Run locally
```bash
cd server && cp .env.example .env     # fill in values
npm install && npm run dev
cd ../client && cp .env.example .env  # VITE_API_URL=http://localhost:5000/api
npm install && npm run dev
```
In Atlas → **Network Access**, allow `0.0.0.0/0` (Render's IPs change).

## Push to GitHub
```bash
git init && git add . && git commit -m "Marketplace"
git branch -M main && git remote add origin <YOUR_REPO_URL> && git push -u origin main
```

## Deploy backend on Render
1. Render → **New → Web Service** → connect GitHub → choose the repo (or **New → Blueprint** to use `render.yaml`).
2. Root Directory `server` · Build `npm install` · Start `npm start` · Health check `/api/health`.
3. Add the env vars above (set `CLIENT_URL` after Vercel gives you a URL, then redeploy).
4. Visit `https://<service>.onrender.com/api/health` → expect `{"ok":true,"db":true}`.

## Deploy frontend on Vercel
1. Vercel → **Add New → Project** → import the same repo.
2. Root Directory `client` · Framework Vite · Build `npm run build` · Output `dist`.
3. Add `VITE_API_URL` = Render URL + `/api` → Deploy (`client/vercel.json` handles SPA routing).
4. Put the Vercel URL into Render's `CLIENT_URL` and redeploy the backend.

Render's free tier sleeps when idle; the first request can take ~50 s.
