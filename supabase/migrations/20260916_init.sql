-- Linux Open Source Coding Club (DBIT) Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    year TEXT NOT NULL,
    section TEXT NOT NULL,
    usn TEXT NOT NULL,
    course TEXT NOT NULL,
    course_other TEXT,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    github_url TEXT NOT NULL,
    linkedin_url TEXT,
    extra_links JSONB DEFAULT '[]'::jsonb,
    about_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_application UNIQUE(user_id)
);

-- Index for fast admin filtering
CREATE INDEX IF NOT EXISTS idx_applications_year_course ON public.applications(year, course);

-- Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT UNIQUE NOT NULL,
    invited_by UUID REFERENCES public.admins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Admin Invitations Table
CREATE TABLE IF NOT EXISTS public.admin_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    invited_by UUID NOT NULL REFERENCES public.admins(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Helper SECURITY DEFINER function to check admin rights cleanly without stale JWTs
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins WHERE admins.user_id = is_admin.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for Applications
CREATE POLICY "Students can view their own application"
    ON public.applications FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Students can insert their own application"
    ON public.applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update their own application"
    ON public.applications FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Students can delete their own application"
    ON public.applications FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- RLS Policies for Admins & Invitations
CREATE POLICY "Admins can view admin list"
    ON public.admins FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view invitations"
    ON public.admin_invitations FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Initial Super Admin Seed (harsha210108@gmail.com)
INSERT INTO public.admins (email)
VALUES ('harsha210108@gmail.com')
ON CONFLICT (email) DO NOTHING;
