# ReviewLens Deployment Guide: Vercel & Render (Non-Docker)

This guide walks you through deploying **ReviewLens** using:
- **Render** for the Node.js / Express backend
- **Vercel** for the React / Vite frontend

---

## 1. Prerequisites

1. **MongoDB Atlas**:
   - Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - In **Database Access**, create a user (username + password).
   - In **Network Access**, allow access from anywhere (`0.0.0.0/0`) so Render can connect.
   - Copy your connection string:
     `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ReviewLens?retryWrites=true&w=majority`

2. **AI Provider API Key**:
   - Get an **OpenRouter** API key from [openrouter.ai](https://openrouter.ai).
   - *(Optional)* Get a **Google Gemini** key from [Google AI Studio](https://aistudio.google.com) as a fallback.

---

## 2. Deploy Backend to Render

1. Go to the [Render Dashboard](https://dashboard.render.com) and click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure service settings:
   - **Name**: `reviewlens-backend`
   - **Region**: Choose the region closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. Add **Environment Variables** in Render:
   | Key | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Production environment |
   | `PORT` | `10000` | Render default port |
   | `MONGODB_URI` | `mongodb+srv://...` | Your Atlas connection string |
   | `OPENROUTER_API_KEY` | `sk-or-...` | Your OpenRouter API key |
   | `OPENROUTER_MODEL` | `nvidia/nemotron-3.5-super-vl:free` | AI model |
   | `OPENROUTER_APP_NAME` | `ReviewLens` | Application name header |
   | `CLIENT_URL` | `https://your-app.vercel.app` | *(Add this after deploying frontend on Vercel)* |
   | `GEMINI_API_KEY` | `your_key` | *(Optional fallback)* |
   | `GEMINI_MODEL` | `gemini-3.5-flash-lite` | *(Optional fallback)* |

5. Under **Advanced**, set **Health Check Path** to `/api/health`.
6. Click **Create Web Service**.
7. Once deployed, copy your backend URL (e.g. `https://reviewlens-backend.onrender.com`).

---

## 3. Deploy Frontend to Vercel

1. Go to the [Vercel Dashboard](https://vercel.com) and click **Add New Project**.
2. Import your GitHub repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. Add **Environment Variable**:
   - `VITE_API_URL`: Paste your Render backend URL (e.g., `https://reviewlens-backend.onrender.com`)

5. Click **Deploy**.
6. When Vercel finishes, copy your live frontend URL (e.g., `https://reviewlens.vercel.app`).

---

## 4. Final Connection (Update CORS on Render)

1. Return to your Render dashboard for `reviewlens-backend`.
2. Go to **Environment** tab.
3. Update `CLIENT_URL` with your exact Vercel frontend URL:
   ```text
   CLIENT_URL=https://reviewlens.vercel.app
   ```
4. Render will automatically redeploy.

---

## 5. Verification

1. **Backend Health Check**:
   Visit `https://<your-render-url>/api/health`. It should return:
   ```json
   {
     "success": true,
     "message": "ReviewLens API is running",
     "database": "connected"
   }
   ```

2. **Frontend UI**:
   Open your Vercel URL in the browser. Upload a CSV of customer reviews, run analysis, and verify sentiment metrics and suggested replies.
