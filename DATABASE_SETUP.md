# Database Setup Guide

## Supabase Database Connection

Your app is now configured to connect to your Supabase database. Here's what has been set up:

### 1. Environment Variables
The following environment variables should be set in your `.env.local` file:

```env
# Supabase Database Configuration
POSTGRES_URL="postgres://postgres.ndbaihkbowthinihayps:tSt5uiUZy3KxgArG@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"
POSTGRES_USER="postgres"
POSTGRES_HOST="db.ndbaihkbowthinihayps.supabase.co"
POSTGRES_PASSWORD="tSt5uiUZy3KxgArG"
POSTGRES_DATABASE="postgres"
POSTGRES_PRISMA_URL="postgres://postgres.ndbaihkbowthinihayps:tSt5uiUZy3KxgArG@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"

# Supabase Configuration
SUPABASE_JWT_SECRET="EDCoNlzPNdWabQNIyDHKSFTTlKxmhPcuo/dCR6kA8P2KxWX/jTDjVcG2mbhhMImnyl69A2ovc04nK3iyNqfq4Q=="
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kYmFpaGtib3d0aGluaWhheXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNTY4MzIsImV4cCI6MjA3NjczMjgzMn0.WgD9j92FvbBXmb81Bgji2QpSg5gQpw5EHt1emnGSXb0"
NEXT_PUBLIC_SUPABASE_URL="https://ndbaihkbowthinihayps.supabase.co"
```

### 2. Database Schema
Run the SQL commands in `database-schema.sql` in your Supabase SQL editor to create the necessary tables:

- `words` - Stores vocabulary words and definitions
- `quizzes` - Stores quiz questions for words
- `user_progress` - Tracks user progress and scores

### 3. Files Created/Updated

- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/database.ts` - Database operation functions
- `src/lib/schema.ts` - Updated with database schemas
- `src/lib/db.ts` - Updated to use Supabase connection
- `src/lib/test-connection.ts` - Database connection testing utilities
- `src/app/api/test-db/route.ts` - API endpoint to test database connection

### 4. Testing the Connection

1. **Install dependencies**: Run `npm install` to install the new Supabase dependency
2. **Set up database**: Run the SQL commands in `database-schema.sql` in your Supabase dashboard
3. **Test connection**: Visit `/api/test-db` in your browser or use the test functions

### 5. Usage Examples

```typescript
import { createWord, getWords, createQuiz } from '@/lib/database';

// Create a new word
const newWord = await createWord({
  word: 'serendipity',
  definition: 'The occurrence of events by chance in a happy way',
  difficulty: 'hard'
});

// Get all words
const words = await getWords();

// Create a quiz for a word
const quiz = await createQuiz({
  word_id: wordId,
  question: 'What does serendipity mean?',
  correct_answer: 'The occurrence of events by chance in a happy way',
  options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
  difficulty: 'hard'
});
```

### 6. Next Steps

1. Create a `.env.local` file with the environment variables above
2. Run the database schema SQL in your Supabase dashboard
3. Test the connection by visiting `/api/test-db`
4. Start building your vocabulary app features!

The database is now ready for your vocabulary learning application!
