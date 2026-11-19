# Swapyard – Buy & Sell Marketplace (MERN)

- `client/`: React, Vite, and Tailwind frontend, deployed on Vercel.
- `server/`: Express API with MongoDB/Mongoose, deployed on Render.
- Image uploads use Cloudinary.

## Required environment variables

| Variable | Set in | Value |
|---|---|---|
| `MONGODB_URI` | Render and `server/.env` locally | MongoDB Atlas connection string |
| `JWT_SECRET` | Render and `server/.env` locally | Long, random secret |
| `CLIENT_URL` | Render and `server/.env` locally | Vercel origin, without a trailing slash; comma-separate multiple origins |
| `CLOUDINARY_CLOUD_NAME` | Render and `server/.env` locally | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Render and `server/.env` locally | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Render and `server/.env` locally | Cloudinary API secret |
| `VITE_API_URL` | Vercel and `client/.env` locally | Render API URL ending in `/api` |
| `PORT` | Local only | Defaults to `5000`; Render supplies its own port |

Never commit real credentials or `.env` files. Start with the checked-in
`.env.example` files.

## Configure MongoDB Atlas

1. Create an Atlas cluster and a database user with a strong password.
2. In **Network Access**, allow connections from your Render service. If using
   Atlas's IP access list with Render's changing outbound IPs, `0.0.0.0/0`
   permits access from any IP; use it only with strong database credentials.
3. Copy the cluster connection string and replace its database username,
   password, and database name as needed. URL-encode special characters in the
   username or password.
4. Set the completed URI as `MONGODB_URI` in Render. For local development,
   put it in `server/.env`.

The API connects to MongoDB at startup and exits with an error if `MONGODB_URI`
is missing or the database connection fails.

## Run locally

```bash
cd server
cp .env.example .env
# Fill in MONGODB_URI, JWT_SECRET, and Cloudinary credentials in server/.env.
npm install
npm run dev
```

In another terminal:

```bash
cd client
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api in client/.env.
npm install
npm run dev
```

## Deploy the API to Render

1. Push this repository to GitHub.
2. In Render, create a **Blueprint** from the repository to apply `render.yaml`,
   or create a **Web Service** with root directory `server`, build command
   `npm install`, start command `npm start`, and health check path
   `/api/health`.
3. Set `MONGODB_URI` and all three Cloudinary variables in the Render service.
   `render.yaml` generates `JWT_SECRET`; set `CLIENT_URL` after deploying the
   frontend.
4. Deploy and check `https://<your-service>.onrender.com/api/health`. A healthy
   API returns `{"ok":true,"db":true}`.

## Deploy the frontend to Vercel

1. Import the same GitHub repository into Vercel and set the project root
   directory to `client`. Vercel detects Vite; the build command is
   `npm run build` and the output directory is `dist`.
2. Set `VITE_API_URL` to `https://<your-service>.onrender.com/api`, then deploy.
   `client/vercel.json` configures SPA route fallback.
3. Copy the Vercel deployment origin (for example,
   `https://your-project.vercel.app`) into the Render `CLIENT_URL` setting, then
   redeploy the API.

Render's free service may sleep while idle, so the first request after a period
of inactivity can take longer.
