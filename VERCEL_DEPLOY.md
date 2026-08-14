# Vercel Deployment Guide

## Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. Ensure your backend is deployed and accessible via a public URL (e.g., `https://your-backend.onrender.com`)

## Deploy Admin Frontend

### Option 1: Deploy from root (recommended for monorepo)
```bash
cd "C:\Users\Win\Desktop\CRM PORTAL"
vercel --yes
```

This uses the root `vercel.json` which:
- Builds only the `packages/admin` package
- Outputs to `packages/admin/dist`
- Configures SPA routing

### Option 2: Deploy admin package only
```bash
cd "C:\Users\Win\Desktop\CRM PORTAL\packages\admin"
vercel --yes
```

## Environment Variables
Set these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | `https://your-backend-url.com/api` | Backend API URL (replace with actual backend URL) |

## Backend Deployment
The NestJS backend cannot run on Vercel serverless with SQLite. Deploy it separately using:
- **Render**: https://render.com
- **Railway**: https://railway.app
- **Fly.io**: https://fly.io

Update `VITE_API_URL` to point to your deployed backend.

## GitHub Integration (Alternative)
1. Push your code to GitHub
2. Import the repo in Vercel Dashboard
3. Set Root Directory to `packages/admin` (if deploying admin only)
4. Set Build Command to `pnpm build`
5. Set Output Directory to `dist`
6. Add `VITE_API_URL` environment variable
7. Deploy
