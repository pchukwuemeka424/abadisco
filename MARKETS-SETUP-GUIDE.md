# Markets Admin Setup Guide

## Issue Fixed
The admin markets page was not working because of missing environment configuration and database permissions.

## What Was Fixed

1. **Environment Configuration**: Created `.env.local.example` with required Supabase variables
2. **Database Permissions**: Created `fix-markets-permissions.sql` to resolve RLS and permission issues
3. **Error Handling**: Enhanced the markets page with better error messages and connection status
4. **User Experience**: Added helpful troubleshooting instructions directly in the UI

## Setup Instructions

### 1. Configure Environment Variables
```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local and add your actual Supabase credentials
# Get these from your Supabase project dashboard
```

### 2. Fix Database Permissions
Run the SQL script in your Supabase dashboard:
```sql
-- Copy and paste the contents of fix-markets-permissions.sql
-- into your Supabase SQL editor and execute
```

### 3. Restart Development Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## What Each Fix Does

### Environment Configuration
- Sets up Supabase connection credentials
- Enables the frontend to communicate with your database

### Database Permissions Script
- Disables restrictive RLS policies temporarily
- Grants necessary permissions to authenticated and anonymous users  
- Creates permissive policies for CRUD operations
- Sets up storage bucket for image uploads
- Adds proper table structure if missing

### Enhanced Error Handling
- Shows connection status in real-time
- Provides specific error messages for different failure types
- Includes step-by-step troubleshooting instructions
- Handles permission errors gracefully

## Verification
After setup, you should see:
- ✅ "Connected to database" status in the markets page
- ✅ Ability to add new markets
- ✅ Ability to edit existing markets  
- ✅ Ability to delete markets
- ✅ Image upload functionality working

## Common Issues

### "Permission denied" errors
- Run the `fix-markets-permissions.sql` script
- Check that your Supabase project allows anonymous access if needed

### "Markets table not found"
- Run the `markets_table.sql` script first
- Ensure the table was created successfully

### Image upload not working
- Check that the 'uploads' storage bucket exists in Supabase
- Verify storage policies allow public uploads

## Files Modified
- `src/app/(admin)/admin/markets/page.tsx` - Enhanced with connection checking and better error handling
- `src/app/(admin)/admin/components/MarketModal.tsx` - Added specific permission error handling
- Created `fix-markets-permissions.sql` - Database permission fixes
- Created `.env.local.example` - Environment configuration template
