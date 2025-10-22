# Deployment Guide for VocabMaster

## Prerequisites

You'll need to install Git and set up a GitHub repository to deploy to Vercel.

### Step 1: Install Git

1. **Download Git for Windows**: Go to https://git-scm.com/download/win
2. **Install Git**: Run the installer with default settings
3. **Restart your terminal/command prompt** after installation

### Step 2: Set up GitHub Repository

1. **Create a new repository on GitHub**:
   - Go to https://github.com/new
   - Name it `vocabmaster` (or any name you prefer)
   - Make it public or private (your choice)
   - Don't initialize with README, .gitignore, or license (we'll add our own)

2. **Initialize Git in your project**:
   ```bash
   # Open Command Prompt or PowerShell in your project directory
   cd C:\Users\lukeo\vocabmaster
   
   # Initialize Git repository
   git init
   
   # Add all files
   git add .
   
   # Make initial commit
   git commit -m "Initial commit: VocabMaster app with Supabase integration"
   
   # Add your GitHub repository as remote (replace YOUR_USERNAME with your GitHub username)
   git remote add origin https://github.com/YOUR_USERNAME/vocabmaster.git
   
   # Push to GitHub
   git branch -M main
   git push -u origin main
   ```

### Step 3: Deploy to Vercel

1. **Go to Vercel**: Visit https://vercel.com
2. **Sign up/Login**: Use your GitHub account
3. **Import Project**: 
   - Click "New Project"
   - Select your `vocabmaster` repository
   - Click "Import"

4. **Configure Environment Variables**:
   In Vercel dashboard, go to your project settings and add these environment variables:
   ```
   POSTGRES_URL=postgres://postgres.ndbaihkbowthinihayps:tSt5uiUZy3KxgArG@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
   POSTGRES_USER=postgres
   POSTGRES_HOST=db.ndbaihkbowthinihayps.supabase.co
   POSTGRES_PASSWORD=tSt5uiUZy3KxgArG
   POSTGRES_DATABASE=postgres
   POSTGRES_PRISMA_URL=postgres://postgres.ndbaihkbowthinihayps:tSt5uiUZy3KxgArG@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
   SUPABASE_JWT_SECRET=EDCoNlzPNdWabQNIyDHKSFTTlKxmhPcuo/dCR6kA8P2KxWX/jTDjVcG2mbhhMImnyl69A2ovc04nK3iyNqfq4Q==
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kYmFpaGtib3d0aGluaWhheXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNTY4MzIsImV4cCI6MjA3NjczMjgzMn0.WgD9j92FvbBXmb81Bgji2QpSg5gQpw5EHt1emnGSXb0
   NEXT_PUBLIC_SUPABASE_URL=https://ndbaihkbowthinihayps.supabase.co
   ```

5. **Deploy**: Click "Deploy" and wait for the build to complete

### Step 4: Set up Database

1. **Go to your Supabase dashboard**: https://supabase.com/dashboard
2. **Open SQL Editor**: In your project dashboard
3. **Run the schema**: Copy and paste the contents of `database-schema.sql` and run it
4. **Test the connection**: Visit `https://your-app.vercel.app/api/test-db` to verify everything works

### Step 5: Test Your App

1. **Visit your deployed app**: Go to the Vercel URL provided after deployment
2. **Test database connection**: Visit `/api/test-db` to ensure the database is connected
3. **Start building features**: Your app is now live and connected to Supabase!

## Quick Commands Summary

After installing Git, run these commands in your project directory:

```bash
# Initialize and push to GitHub
git init
git add .
git commit -m "Initial commit: VocabMaster app with Supabase integration"
git remote add origin https://github.com/YOUR_USERNAME/vocabmaster.git
git branch -M main
git push -u origin main
```

## Troubleshooting

- **Git not found**: Make sure to restart your terminal after installing Git
- **Permission denied**: You may need to set up SSH keys or use HTTPS with a personal access token
- **Build errors**: Check that all environment variables are set correctly in Vercel
- **Database connection issues**: Verify your Supabase credentials and that the database schema is set up

## Next Steps

Once deployed:
1. Set up the database schema in Supabase
2. Test the `/api/test-db` endpoint
3. Start building your vocabulary app features
4. Consider setting up authentication with Supabase Auth
