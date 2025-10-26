# Deployment Fix Guide

## Issue
Getting 404 error when accessing `/auth/me` endpoint in production.

## Root Cause
The frontend axios configuration was using `http://localhost:5001/api` as the default API URL in production because the `VITE_API_URL` environment variable was not set.

## Solution Applied

### 1. Updated Axios Configuration
Modified `/client/src/utils/axios.ts` to:
- Use relative path `/api` in production (leveraging Netlify proxy)
- Use `http://localhost:5001/api` in development
- Allow override with `VITE_API_URL` environment variable if needed

### 2. Verified Configurations
- ✅ Netlify proxy is configured in `netlify.toml` to forward `/api/*` → `https://cloud-nest-pi.vercel.app/api/*`
- ✅ Backend CORS allows `https://cloudnest.qadirdadkazi.com`
- ✅ Content Security Policy allows `'self'` for API connections
- ✅ `/auth/me` endpoint exists in backend

## Deployment Steps

### Step 1: Commit and Push Changes
```bash
git add .
git commit -m "Fix: Use relative API URLs in production for Netlify proxy"
git push origin main
```

### Step 2: Verify Backend is Running
Visit: https://cloud-nest-pi.vercel.app
- Should see: "CloudNest API is running"
- If not, redeploy the backend on Vercel

### Step 3: Redeploy Frontend on Netlify
The push should trigger an automatic deployment. If not:
1. Go to Netlify dashboard
2. Navigate to your site
3. Click "Trigger deploy" → "Deploy site"

### Step 4: Test the Deployment
After deployment completes:
1. Visit https://cloudnest.qadirdadkazi.com
2. Open browser console (F12)
3. Try to access the site
4. Check if the `/auth/me` request works

## Troubleshooting

### If Backend is Not Accessible
1. Check Vercel deployment logs
2. Verify environment variables are set on Vercel:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `ALLOWED_ORIGINS=https://cloudnest.qadirdadkazi.com`

### If Still Getting 404
1. Check browser network tab to see the actual URL being called
2. Verify the request is going to `/api/auth/me` (relative URL)
3. Check Netlify function logs for any proxy errors

### If CORS Errors Appear
Update the backend `ALLOWED_ORIGINS` environment variable on Vercel to include your Netlify domain:
```
ALLOWED_ORIGINS=https://cloudnest.qadirdadkazi.com,https://cloudnest.netlify.app
```

## Environment Variables

### Frontend (Netlify)
No environment variables required! The app uses relative URLs by default.

Optional:
- `VITE_API_URL` - Only if you want to override the default API URL

### Backend (Vercel)
Required:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens (min 32 characters)
- `NODE_ENV` - Set to `production`
- `PORT` - Usually set automatically by Vercel

Optional:
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins
- `CLOUDINARY_CLOUD_NAME` - For image uploads
- `CLOUDINARY_API_KEY` - For image uploads
- `CLOUDINARY_API_SECRET` - For image uploads

## How It Works Now

### Development
```
Frontend → http://localhost:5173
Backend → http://localhost:5001/api
```

### Production
```
Frontend → https://cloudnest.qadirdadkazi.com
           ↓
           /api/* requests
           ↓
Netlify Proxy → https://cloud-nest-pi.vercel.app/api/*
                ↓
                Backend (Vercel)
```

The Netlify proxy makes the API requests appear to come from the same origin, avoiding CORS issues and ensuring cookies work properly.

## Verification Checklist
- [ ] Changes committed and pushed
- [ ] Backend is accessible at https://cloud-nest-pi.vercel.app
- [ ] Frontend redeployed on Netlify
- [ ] Can access https://cloudnest.qadirdadkazi.com without errors
- [ ] Can register/login successfully
- [ ] No 404 errors in browser console

## Additional Notes
- The Netlify proxy handles routing `/api/*` requests automatically
- No need to configure CORS between Netlify and browser (same origin)
- CORS is only needed between Netlify and Vercel (already configured)
- Cookies work properly with this setup

