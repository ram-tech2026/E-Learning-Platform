-- Schema for Learning Website

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create career_paths table
CREATE TABLE IF NOT EXISTS public.career_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    learning_goal TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create career_milestones table
CREATE TABLE IF NOT EXISTS public.career_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    career_path_id UUID REFERENCES public.career_paths(id) ON DELETE CASCADE,
    milestone_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_topics table
CREATE TABLE IF NOT EXISTS public.daily_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    estimated_minutes INTEGER NOT NULL DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS (Row Level Security) policies
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_topics ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = user_id);

-- Create policies for career_paths
CREATE POLICY "Users can view their own career paths" 
    ON public.career_paths FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own career paths" 
    ON public.career_paths FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own career paths" 
    ON public.career_paths FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own career paths" 
    ON public.career_paths FOR DELETE 
    USING (auth.uid() = user_id);

-- Create policies for career_milestones
CREATE POLICY "Users can view their own milestones" 
    ON public.career_milestones FOR SELECT 
    USING (
        career_path_id IN (
            SELECT id FROM public.career_paths WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert milestones to their own career paths" 
    ON public.career_milestones FOR INSERT 
    WITH CHECK (
        career_path_id IN (
            SELECT id FROM public.career_paths WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own milestones" 
    ON public.career_milestones FOR UPDATE 
    USING (
        career_path_id IN (
            SELECT id FROM public.career_paths WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own milestones" 
    ON public.career_milestones FOR DELETE 
    USING (
        career_path_id IN (
            SELECT id FROM public.career_paths WHERE user_id = auth.uid()
        )
    );

-- Create policies for daily_topics
CREATE POLICY "Users can view their own daily topics" 
    ON public.daily_topics FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily topics" 
    ON public.daily_topics FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily topics" 
    ON public.daily_topics FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily topics" 
    ON public.daily_topics FOR DELETE 
    USING (auth.uid() = user_id);

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_career_paths
BEFORE UPDATE ON public.career_paths
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_career_milestones
BEFORE UPDATE ON public.career_milestones
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_daily_topics
BEFORE UPDATE ON public.daily_topics
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at(); 