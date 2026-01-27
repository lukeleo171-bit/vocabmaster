# Firebase App Hosting Deployment Guide

## Prerequisites

1. Firebase project set up
2. Firebase CLI installed (`npm install -g firebase-tools`)
3. GitHub repository connected to Firebase

## Required Environment Variables

Set these in Firebase Console: **Project Settings > App Hosting > Environment Variables**

### Required for AI Features (Genkit)
```
GOOGLE_API_KEY=your_google_ai_api_key_here
```
OR
```
GOOGLEAI_API_KEY=your_google_ai_api_key_here
```
OR
```
GEMINI_API_KEY=your_google_ai_api_key_here
```

**To get a Google AI API key:**
1. Go to https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to Firebase environment variables

### Required for Supabase Integration
```
NEXT_PUBLIC_SUPABASE_URL=https://ndbaihkbowthinihayps.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kYmFpaGtib3d0aGluaWhheXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNTY4MzIsImV4cCI6MjA3NjczMjgzMn0.WgD9j92FvbBXmb81Bgji2QpSg5gQpw5EHt1emnGSXb0
```

### Optional Database Variables (if using direct Postgres access)
```
POSTGRES_URL=postgres://postgres.ndbaihkbowthinihayps:tSt5uiUZy3KxgArG@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
POSTGRES_USER=postgres
POSTGRES_HOST=db.ndbaihkbowthinihayps.supabase.co
POSTGRES_PASSWORD=tSt5uiUZy3KxgArG
POSTGRES_DATABASE=postgres
POSTGRES_PRISMA_URL=postgres://postgres.ndbaihkbowthinihayps:tSt5uiUZy3KxgArG@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
SUPABASE_JWT_SECRET=EDCoNlzPNdWabQNIyDHKSFTTlKxmhPcuo/dCR6kA8P2KxWX/jTDjVcG2mbhhMImnyl69A2ovc04nK3iyNqfq4Q==
```

## Deployment Steps

1. **Set Environment Variables in Firebase Console:**
   - Go to Firebase Console
   - Select your project
   - Go to Project Settings > App Hosting
   - Add all required environment variables listed above

2. **Connect GitHub Repository:**
   - In Firebase Console, go to App Hosting
   - Click "Create backend"
   - Connect your GitHub repository
   - Select the branch (usually `main`)

3. **Deploy:**
   - Firebase will automatically deploy when you push to the connected branch
   - Or manually trigger deployment from Firebase Console

## Troubleshooting "Provisioning Integrations Failed"

This error typically occurs when:

1. **Missing GOOGLE_API_KEY**: The app uses Genkit AI which requires a Google AI API key
   - Solution: Add `GOOGLE_API_KEY` (or `GOOGLEAI_API_KEY` or `GEMINI_API_KEY`) to Firebase environment variables

2. **Missing Supabase Variables**: Required for database functionality
   - Solution: Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Integration Permissions**: Firebase needs permission to access integrations
   - Solution: Check Firebase Console > Project Settings > Integrations to ensure all required integrations are enabled

4. **Build Errors**: Check build logs in Firebase Console
   - Go to App Hosting > Your Backend > Builds
   - Check the latest build logs for specific errors

## Verifying Deployment

After deployment:
1. Check the build logs in Firebase Console
2. Visit your deployed app URL
3. Test the database connection: `/api/test-db`
4. Test AI features by creating a quiz

## Notes

- Environment variables are case-sensitive
- Changes to environment variables require a new deployment
- The app will work without `GOOGLE_API_KEY` but AI features will fail (this is handled gracefully)
- Make sure your Firebase project has billing enabled if using paid services

