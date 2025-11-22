# ⚠️ IMPORTANT: Supabase Setup Required

## The frontend needs Supabase credentials to run!

### Quick Fix (2 minutes):

**Option 1: Use Your Team's Supabase Project**
Ask **Marvin** or **Powromita** for the Supabase credentials from your shared project:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY  
- SUPABASE_SERVICE_ROLE_KEY

Then update `frontend/.env.local` with those values.

**Option 2: Create Your Own Supabase Project**
1. Go to https://app.supabase.com
2. Click "New Project"
3. Name it "odoo-hackathon" (or anything)
4. Wait 2 minutes for setup
5. Go to Settings → API
6. Copy the credentials to `frontend/.env.local`

### After Getting Credentials:

1. **Update** `frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
```

2. **Restart** the dev server:
```bash
# Press Ctrl+C to stop
npm run dev
```

3. **Done!** ✅ Open http://localhost:3001

---

## Need Help?

Check Marvin's or Powromita's code - they already have the Supabase setup!

Or follow the full guide: `SUPABASE_SETUP.md`
