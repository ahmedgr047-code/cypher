-- Setup for External Database
-- This script will drop existing tables and create new ones for the chatbot system
-- WARNING: This will delete all existing data in the specified tables!

-- Drop all existing tables if they exist
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS quick_chips CASCADE;
DROP TABLE IF EXISTS sheet_archive CASCADE;
DROP TABLE IF EXISTS subjects_catalog CASCADE;

-- Drop existing storage bucket if it exists
DELETE FROM storage.buckets WHERE id = 'sheets';

-- Create new tables for the chatbot application

-- Users table for authentication
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  password_hash VARCHAR(255), -- For future password storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  image_url TEXT,
  provider VARCHAR(20), -- 'gemini' or 'groq'
  key_index INTEGER, -- Which API key was used
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table for archived documents
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  public_url VARCHAR(500) NOT NULL,
  category VARCHAR(100) NOT NULL CHECK (category IN ('documents', 'sheets', 'images', 'other')),
  description TEXT,
  file_size BIGINT,
  file_type VARCHAR(100),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_files_category ON files(category);
CREATE INDEX idx_files_name ON files(name);
CREATE INDEX idx_files_created_at ON files(created_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (change credentials as needed)
INSERT INTO users (email, name, role)
VALUES ('admin@cypher.com', 'Cypher Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Create sample data for testing (optional)
-- You can comment this out in production

-- Sample conversation
INSERT INTO conversations (user_id, title)
SELECT id, 'Sample Conversation'
FROM users 
WHERE email = 'admin@cypher.com'
LIMIT 1;

-- Sample message
INSERT INTO messages (conversation_id, content, role, provider, key_index)
SELECT c.id, 'Hello! How can I help you today?', 'assistant', 'gemini', 0
FROM conversations c
JOIN users u ON c.user_id = u.id
WHERE u.email = 'admin@cypher.com'
LIMIT 1;

-- Success message
SELECT 'External database setup completed successfully!' as status,
       'Tables created: users, conversations, messages, files' as tables_created,
       'Default admin user: admin@cypher.com' as admin_info;
