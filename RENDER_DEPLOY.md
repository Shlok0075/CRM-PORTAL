# Render Deployment Guide

## Prerequisites
1. Push your code to GitHub (already done)
2. Sign up at https://render.com (free tier available)

## Step 1: Create PostgreSQL Database

1. Go to https://dashboard.render.com
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name:** `crm-portal-db`
   - **Plan:** Free
   - **Database Name:** `crm_portal`
   - **User:** `crm_user` (or use default)
4. Click **Create Database**
5. After creation, copy the **Connection URL** (you'll need it for Step 3)

## Step 2: Deploy Backend Web Service

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Connect your GitHub repository: `Shlok0075/CRM-PORTAL`
4. Configure:
   - **Name:** `crm-portal-backend`
   - **Plan:** Free
   - **Root Directory:** `packages/backend`
   - **Runtime:** Node
    - **Build Command:** `pnpm install && npx prisma generate && pnpm run build`
    - **Start Command:** `npx prisma db push && pnpm run start`
   - **Plan:** Free

## Step 3: Set Environment Variables

In the **Environment** section of your web service, add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Generate a strong random string (e.g., use https://random.org) |
| `DATABASE_URL` | Paste the connection URL from Step 1 |

**Important:** Render automatically sets the `PORT` environment variable. Do NOT set it manually.

## Step 4: Deploy

1. Click **Create Web Service**
2. Render will:
   - Install dependencies
   - Build the TypeScript code
   - Run Prisma migrations (if configured)
   - Start the server

3. After deployment, your backend will be available at:
   `https://crm-portal-backend.onrender.com`

## Step 5: Update Vercel Frontend

Once your backend is live:
1. Go to https://vercel.com → `admin-ten-lac-13` project → **Settings** → **Environment Variables**
2. Update `VITE_API_URL` to: `https://crm-portal-backend.onrender.com/api`
3. Redeploy the Vercel project

## Troubleshooting

### Build fails with Prisma errors
Make sure `prisma:generate` runs after `build` in the build command.

### Database connection errors
Verify that:
- The PostgreSQL database is in the same region as the web service
- `DATABASE_URL` is correctly set
- The database user has proper permissions

### App crashes on startup
Check Render logs for errors. Common issues:
- Missing environment variables
- Port configuration (Render sets PORT automatically)
- Prisma migration issues

## Notes

- Render free tier web services sleep after 15 minutes of inactivity
- First request after sleep may take 30-50 seconds to wake up
- PostgreSQL free tier has 256 MB storage
- Consider upgrading to paid plan for production use
