-- Enable the UUID extension (if not already enabled)
create extension if not exists "uuid-ossp";

-- Create the reports table
create table public.reports (
  id text primary key,
  user_id text not null,
  user_name text not null,
  category text not null,
  description text not null,
  image_url text,
  latitude float8,
  longitude float8,
  address text not null,
  status text not null default 'pending',
  priority text not null default 'low',
  assigned_technician_id text,
  assigned_officer_id text,
  resolution_notes text,
  -- Duplicate detection fields
  parent_report_id text references public.reports(id),
  duplicate_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.reports enable row level security;

-- Create policies

-- 1. Allow public read access (for now, to let anyone see reports)
-- In production, you might restrict this.
create policy "Allow public read access"
  on public.reports for select
  using (true);

-- 2. Allow authenticated users to insert reports
-- (Assuming 'anon' key usage for public reporting, we allow anon install for now)
create policy "Allow public insert access"
  on public.reports for insert
  with check (true);

-- 3. Allow users to update their own reports (if needed) or allow technicians
-- For the dashboard, we might need update access for status changes.
-- Allowing public updates for the prototype for simplicity.
create policy "Allow public update access"
  on public.reports for update
  using (true);

-- 4. Allow users to delete their own reports (matching user_id or similar logic)
-- For prototype, allowing delete by ID if it exists.
create policy "Allow public delete access"
  on public.reports for delete
  using (true);

-- Create a storage bucket for report images (optional, if you plan to move images to Supabase Storage later)
insert into storage.buckets (id, name, public) 
values ('report-images', 'report-images', true)
on conflict do nothing;

-- Storage policy to allow public uploads
create policy "Allow public uploads"
  on storage.objects for insert
  with check (bucket_id = 'report-images');

-- Storage policy to allow public viewing
create policy "Allow public viewing"
  on storage.objects for select
  using (bucket_id = 'report-images');
