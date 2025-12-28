-- Create entries table for payment tracker
CREATE TABLE IF NOT EXISTS entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'debit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create an index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);

-- Enable Row Level Security (RLS) - you can adjust policies as needed
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (you may want to restrict this based on your auth needs)
-- For now, this allows anyone to read/write (adjust based on your security requirements)
CREATE POLICY "Allow all operations" ON entries
  FOR ALL
  USING (true)
  WITH CHECK (true);

