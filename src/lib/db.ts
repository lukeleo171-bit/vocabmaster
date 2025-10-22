
// Note: For Vercel serverless deployment, we'll use Supabase client instead of direct PostgreSQL
// This file is kept for compatibility but the actual database operations should use Supabase

import { supabase } from './supabase';

// Export supabase as the database connection for compatibility
export default supabase;
