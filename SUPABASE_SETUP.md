# Supabase Setup Instructions

## Step 1: Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and sign in to your account
2. Open your project (or create a new one if you don't have one)
3. Go to **Settings** → **API**
4. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

## Step 2: Update Your .env File

1. Open the `.env` file in your project root
2. Replace the placeholder values with your actual credentials:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

## Step 3: Create the Database Table

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `supabase_migration.sql` into the editor
4. Click **Run** to execute the SQL
5. You should see a success message

Alternatively, you can run the migration using the Supabase CLI if you have it set up.

## Step 4: Test Your App

1. Start your development server: `npm run dev`
2. The app should now:
   - Load entries from your Supabase database when it starts
   - Save new entries to the database when you add them
   - Update entries when you mark them as paid
   - Delete entries from the database when you delete them

## Troubleshooting

- **"Missing Supabase environment variables" error**: Make sure your `.env` file has the correct values and you've restarted your dev server
- **Connection timeout**: Check that your Supabase project is active and your credentials are correct
- **"Failed to load entries"**: Make sure you've created the `entries` table in your Supabase database

