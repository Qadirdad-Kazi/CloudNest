# CloudNest Deployment Guide

This guide provides instructions for deploying the CloudNest application, with the frontend on Netlify and the backend on Vercel.

## Prerequisites

- GitHub account
- Netlify account
- Vercel account
- MongoDB Atlas account (for production database)

## Backend Deployment (Vercel)

1. **Prepare your environment variables**:
   - Create a MongoDB Atlas cluster and get your connection string
   - Set up the required environment variables in Vercel:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: A secure random string for JWT token generation
     - `JWT_EXPIRE`: Token expiration time (e.g., "7d")
     - `CLIENT_URL`: Your frontend URL (e.g., "https://cloudnest-app.netlify.app")
     - `NODE_ENV`: Set to "production"

2. **Deploy to Vercel**:
   - Push your code to GitHub
   - Log in to Vercel and create a new project
   - Import your GitHub repository
   - Configure the project:
     - Build Command: `npm run build`
     - Output Directory: (leave empty)
     - Install Command: `npm install`
   - Add environment variables from step 1
   - Deploy

3. **Verify the deployment**:
   - Test the API endpoints using tools like Postman
   - Make sure the authentication routes are working
   - Check that CORS is properly configured to allow requests from your frontend

## Frontend Deployment (Netlify)

1. **Prepare your environment variables**:
   - Set up the required environment variables in Netlify:
     - `VITE_API_URL`: Your backend API URL (e.g., "https://cloudnest-server.vercel.app/api")
     - `VITE_NODE_ENV`: Set to "production"
     - `VITE_CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
     - `VITE_CLOUDINARY_API_KEY`: Your Cloudinary API key
     - `VITE_CLOUDINARY_UPLOAD_URL`: Your Cloudinary upload URL

2. **Deploy to Netlify**:
   - Push your code to GitHub
   - Log in to Netlify and create a new site
   - Import your GitHub repository
   - Configure the build settings:
     - Build Command: `npm run build`
     - Publish Directory: `dist`
   - Add environment variables from step 1
   - Deploy

3. **Configure Netlify for SPA routing**:
   - The `netlify.toml` file should already include the necessary redirects for SPA routing
   - Verify that routes like `/login` and `/dashboard` work correctly

## Post-Deployment Steps

1. **Update CORS settings**:
   - Make sure the backend's CORS configuration includes your frontend's domain

2. **Test the full application**:
   - Register a new user
   - Log in with the new user
   - Test file uploads, downloads, and sharing
   - Test folder creation and navigation

3. **Monitor for errors**:
   - Set up error monitoring in both Vercel and Netlify
   - Check logs regularly during the initial deployment phase

## Troubleshooting

- **CORS Issues**: If you encounter CORS errors, verify that the backend's CORS configuration includes your frontend's domain.
- **Authentication Problems**: Check that the JWT secret is properly set in the environment variables.
- **Database Connection**: Ensure your MongoDB connection string is correct and that network access is properly configured.
- **Environment Variables**: Double-check that all required environment variables are set correctly in both Vercel and Netlify.

## Updating Your Deployment

1. **Backend Updates**:
   - Push changes to your GitHub repository
   - Vercel will automatically rebuild and deploy the changes

2. **Frontend Updates**:
   - Push changes to your GitHub repository
   - Netlify will automatically rebuild and deploy the changes

## Custom Domain Setup (Optional)

1. **Backend (Vercel)**:
   - Go to your project settings in Vercel
   - Navigate to the "Domains" section
   - Add your custom domain (e.g., "api.cloudnest.com")
   - Update your DNS settings as instructed by Vercel

2. **Frontend (Netlify)**:
   - Go to your site settings in Netlify
   - Navigate to the "Domain management" section
   - Add your custom domain (e.g., "cloudnest.com")
   - Update your DNS settings as instructed by Netlify

3. **Update Environment Variables**:
   - Update the `CLIENT_URL` in your backend environment variables
   - Update the `VITE_API_URL` in your frontend environment variables
