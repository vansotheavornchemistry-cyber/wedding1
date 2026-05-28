-- SUPABASE SQL SETUP SCRIPT
-- Copy and paste this script directly into your Supabase SQL Editor.

-- Drop existing tables if they exist (clean setup)
DROP TABLE IF EXISTS guests CASCADE;
DROP TABLE IF EXISTS weddings CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create 'admins' table
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create 'weddings' table
CREATE TABLE weddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    host_username TEXT NOT NULL UNIQUE,
    host_password TEXT NOT NULL,
    khqr_img_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create 'guests' table
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    companions INTEGER NOT NULL DEFAULT 0,
    relation_type TEXT NOT NULL, -- e.g. 'ខាងកូនកំលោះ', 'ខាងកូនក្រមុំ', 'មិត្តភក្តិ', 'ផ្សេងៗ'
    amount NUMERIC NOT NULL DEFAULT 0,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' or 'approved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Create ALL PUBLIC PERMISSIVE policies for Prototype (as requested)
-- Admins Policy
CREATE POLICY "Public permissive read for admins" ON admins FOR SELECT USING (true);
CREATE POLICY "Public permissive insert for admins" ON admins FOR INSERT WITH CHECK (true);
CREATE POLICY "Public permissive update for admins" ON admins FOR UPDATE USING (true);
CREATE POLICY "Public permissive delete for admins" ON admins FOR DELETE USING (true);

-- Weddings Policy
CREATE POLICY "Public permissive read for weddings" ON weddings FOR SELECT USING (true);
CREATE POLICY "Public permissive insert for weddings" ON weddings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public permissive update for weddings" ON weddings FOR UPDATE USING (true);
CREATE POLICY "Public permissive delete for weddings" ON weddings FOR DELETE USING (true);

-- Guests Policy
CREATE POLICY "Public permissive read for guests" ON guests FOR SELECT USING (true);
CREATE POLICY "Public permissive insert for guests" ON guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public permissive update for guests" ON guests FOR UPDATE USING (true);
CREATE POLICY "Public permissive delete for guests" ON guests FOR DELETE USING (true);

-- Seed data: Default Admin (admin123 / password123)
INSERT INTO admins (username, password)
VALUES ('admin123', 'password123')
ON CONFLICT (username) DO NOTHING;

-- Seed data: Default Wedding event (Host: socheata123 / password123)
-- Using a standard wedding KHQR mockup placeholder
INSERT INTO weddings (id, title, host_username, host_password, khqr_img_url)
VALUES (
    '88888888-8888-4888-baaa-888888888888',
    N'ពិធីមង្គលការ សុភ័ក្ត្រ និង សុជាតា',
    'socheata123',
    'password123',
    'https://api-qr.bakong.org.kh/images/khqr_mock.png' -- Standard Bakong template or general ImgBB URL
)
ON CONFLICT (host_username) DO NOTHING;

-- Seed data: Sample guests
INSERT INTO guests (wedding_id, name, phone, companions, relation_type, amount, note, status)
VALUES 
(
    '88888888-8888-4888-baaa-888888888888',
    N'លោក ចាន់ ណារិទ្ធ',
    '012345678',
    2,
    N'ខាងកូនកំលោះ',
    50,
    N'សូមជូនពរឱ្យអ្នកទាំងពីរកាន់ដៃគ្នាជារៀងរហូត!',
    'approved'
),
(
    '88888888-8888-4888-baaa-888888888888',
    N'អ្នកស្រី សុខ ម៉ារី',
    '098765432',
    1,
    N'ខាងកូនក្រមុំ',
    100,
    N'ជោគជ័យ និងសុភមង្គល!',
    'approved'
),
(
    '88888888-8888-4888-baaa-888888888888',
    N'លោក លី សុជាតិ',
    '088123456',
    0,
    N'មិត្តភក្តិ',
    30,
    N'សុំទោសដែលមិនបានទៅផ្ទាល់ តែសូមជូនពរពីចម្ងាយ!',
    'pending'
);
