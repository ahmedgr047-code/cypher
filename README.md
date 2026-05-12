# Cypher AI Chatbot Backend

A comprehensive backend system for an AI-powered chatbot with file management, authentication, and multi-provider AI integration.

## Features

- 🤖 **Multi-Provider AI Integration**: Gemini and Groq API with automatic failover
- 📁 **File Management System**: Upload, archive, and search documents and images
- 🔐 **User Authentication**: Secure login and registration system
- 🎯 **Admin Dashboard**: Complete file management interface
- 📊 **Supabase Integration**: Database and storage management
- 🚀 **Vercel Ready**: Optimized for deployment

## Setup Instructions

### 1. Environment Configuration

Copy the `.env.example` file to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Update the following environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI API Keys
GEMINI_API_KEY_1=your_first_gemini_api_key
GEMINI_API_KEY_2=your_second_gemini_api_key
GROQ_API_KEY_1=your_first_groq_api_key
GROQ_API_KEY_2=your_second_groq_api_key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_key
```

### 2. Supabase Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. Create a storage bucket named `archive`
4. Set up Row Level Security (RLS) policies as defined in the schema

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth authentication
- `POST /api/register` - User registration

### Chat System
- `POST /api/chat` - Send message to AI
- `GET /api/chat?conversationId={id}` - Get conversation history

### File Management
- `POST /api/upload` - Upload file to archive
- `GET /api/upload` - List all files
- `GET /api/search?q={query}&category={category}` - Search files
- `DELETE /api/upload?id={fileId}` - Delete file (admin only)

## Database Schema

### Tables

#### Users
- `id` (UUID) - Primary key
- `email` (VARCHAR) - User email
- `name` (VARCHAR) - User name
- `role` (VARCHAR) - User role (user/admin)
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

#### Conversations
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `title` (VARCHAR) - Conversation title
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

#### Messages
- `id` (UUID) - Primary key
- `conversation_id` (UUID) - Foreign key to conversations
- `content` (TEXT) - Message content
- `role` (VARCHAR) - Message role (user/assistant)
- `image_url` (TEXT) - Optional image URL
- `provider` (VARCHAR) - AI provider used
- `key_index` (INTEGER) - Which API key was used
- `created_at` (TIMESTAMP) - Creation timestamp

#### Files
- `id` (UUID) - Primary key
- `name` (VARCHAR) - Original filename
- `file_path` (VARCHAR) - Storage path
- `public_url` (VARCHAR) - Public URL
- `category` (VARCHAR) - File category
- `description` (TEXT) - File description
- `file_size` (BIGINT) - File size in bytes
- `file_type` (VARCHAR) - MIME type
- `uploaded_by` (UUID) - Foreign key to users
- `created_at` (TIMESTAMP) - Creation timestamp

## AI Integration

The system supports multiple AI providers with automatic failover:

### Gemini Integration
- Uses `gemini-pro` for text responses
- Uses `gemini-pro-vision` for image analysis
- Supports 2 API keys with rotation

### Groq Integration
- Uses `mixtral-8x7b-32768` model
- Supports 2 API keys with rotation
- Acts as fallback when Gemini fails

### Failover Logic
1. Try first Gemini key
2. Try second Gemini key
3. Try first Groq key
4. Try second Groq key
5. Return error if all fail

## File Categories

Files are organized into categories:
- `documents` - PDF, DOC, DOCX, TXT files
- `sheets` - Excel files and spreadsheets
- `images` - JPG, JPEG, PNG files
- `other` - All other file types

## Admin Features

The admin dashboard (`/admin`) provides:
- File upload interface
- File management (view, download, delete)
- Search functionality
- Category-based organization

## Security Features

- Row Level Security (RLS) on all tables
- Admin-only file management
- Secure authentication with NextAuth
- Environment variable protection
- Input validation and sanitization

## Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically

The `vercel.json` file includes:
- Build configuration
- Environment variable mapping
- Function timeouts
- Framework settings

## Development

### Project Structure

```
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── chat/           # Chat endpoints
│   │   ├── upload/         # File upload endpoints
│   │   ├── search/         # Search endpoints
│   │   └── register/       # Registration endpoint
│   ├── (auth)/             # Authentication pages
│   ├── (chat)/             # Chat application
│   ├── admin/              # Admin dashboard
│   └── layout.tsx          # Root layout
├── components/             # React components
├── lib/                    # Utility libraries
│   ├── ai-service.ts       # AI integration
│   └── supabase.ts         # Supabase client
├── types/                  # TypeScript definitions
├── supabase-schema.sql     # Database schema
├── vercel.json            # Vercel configuration
└── README.md              # This file
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check NextAuth secret is set
   - Verify Supabase connection
   - Ensure environment variables are correct

2. **AI Provider Failures**
   - Verify API keys are valid
   - Check API key permissions
   - Monitor rate limits

3. **File Upload Issues**
   - Check Supabase storage permissions
   - Verify bucket exists
   - Check file size limits

4. **Database Connection**
   - Verify Supabase URL and keys
   - Check RLS policies
   - Ensure schema is applied

### Logs and Monitoring

- Check browser console for frontend errors
- Monitor Vercel function logs
- Review Supabase logs
- Check AI provider dashboards

## Support

For issues and questions:
1. Check this README
2. Review the code comments
3. Check the troubleshooting section
4. Create an issue in the repository

---

**Note**: This backend is designed to work with the existing frontend. Make sure all environment variables are properly configured before running the application.
