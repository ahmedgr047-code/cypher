# Vercel Deployment Fixes

## Common Issues and Solutions

### 1. Build Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clean build
rm -rf .next
npm run build
```

### 2. Environment Variables Issues
Make sure all variables are set in Vercel:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- GEMINI_API_KEY_1
- GEMINI_API_KEY_2
- GROQ_API_KEY_1
- GROQ_API_KEY_2
- GEMINI_MODEL
- GROQ_MODEL
- NEXTAUTH_URL
- NEXTAUTH_SECRET

### 3. Git and Next.js Issues
Add this to `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  }
}

export default nextConfig
```

### 4. Supabase Connection Issues
Update `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 5. Deployment Steps
1. Push to GitHub
2. Connect Vercel to GitHub
3. Set all environment variables
4. Deploy

### 6. Check Vercel Logs
- Go to Vercel dashboard
- Click on your project
- Check "Functions" tab for errors
- Check "Build Logs" for build issues
