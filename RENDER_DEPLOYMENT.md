# Poker Results Tracker - Render Deployment Guide

## Step 1: Create Render Account
1. Sign up at [render.com](https://render.com)
2. Verify your email

## Step 2: Create PostgreSQL Database
1. Go to Dashboard → "New +" → "PostgreSQL"
2. Name: `poker-results-db`
3. Choose free tier
4. Wait for deployment
5. Copy the database connection details

## Step 3: Deploy Backend Service
1. Go to Dashboard → "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `poker-results-api`
   - **Root Directory**: `poker-results-tracker-be`
   - **Runtime**: `Node 18`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Health Check Path**: `/health`

## Step 4: Set Environment Variables
In your Web Service settings, add these environment variables:

### Database Variables (from your PostgreSQL service):
```
POSTGRES_HOST=your-db-host.render.com
POSTGRES_PORT=5432
POSTGRES_USER=your-db-user
POSTGRES_PASSWORD=your-db-password
POSTGRES_NAME=your-db-name
```

### Application Variables:
```
NEST_HOST=0.0.0.0
NEST_PORT=3000
PASSPORT_SECRET=your-secure-secret-key-here
CLIENT_HOST=your-netlify-app.netlify.app
CLIENT_PORT=443
```

## Step 5: Update Frontend
In your Netlify deployment, update the API URL to point to your Render backend:
```
VITE_API_URL=https://your-backend-name.onrender.com
```

## Step 6: Deploy
1. Push your code to GitHub
2. Render will automatically deploy
3. Check the logs for any issues

## Important Notes:
- The free PostgreSQL database sleeps after inactivity and may take 30 seconds to wake up
- Your backend URL will be: `https://your-service-name.onrender.com`
- Make sure to update CORS settings with your Netlify URL
- Generate a secure PASSPORT_SECRET for production
