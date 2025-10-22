-- Vocabulary Master Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Words table
CREATE TABLE IF NOT EXISTS words (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    word VARCHAR(255) NOT NULL UNIQUE,
    definition TEXT NOT NULL,
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    correct_answer VARCHAR(255) NOT NULL,
    options JSONB NOT NULL, -- Array of answer options
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress table
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- You can link this to Supabase auth.users if needed
    score INTEGER CHECK (score >= 0 AND score <= 100) DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    last_attempted TIMESTAMP WITH TIME ZONE,
    mastered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(word_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_words_difficulty ON words(difficulty);
CREATE INDEX IF NOT EXISTS idx_quizzes_word_id ON quizzes(word_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_word_id ON user_progress(word_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_words_updated_at BEFORE UPDATE ON words
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data
INSERT INTO words (word, definition, difficulty) VALUES
    ('serendipity', 'The occurrence and development of events by chance in a happy or beneficial way', 'hard'),
    ('ephemeral', 'Lasting for a very short time', 'medium'),
    ('ubiquitous', 'Present, appearing, or found everywhere', 'hard'),
    ('mellifluous', 'Sweet or musical; pleasant to hear', 'hard'),
    ('petrichor', 'The pleasant, earthy smell after rain', 'medium'),
    ('wanderlust', 'A strong desire to travel and explore the world', 'easy'),
    ('nostalgia', 'A sentimental longing for the past', 'easy'),
    ('eloquent', 'Fluent or persuasive in speaking or writing', 'medium')
ON CONFLICT (word) DO NOTHING;
