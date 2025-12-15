-- Schema update for Learning Website - Only new parts

-- Create daily_topics table if it doesn't exist
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

-- Enable RLS on daily_topics table
ALTER TABLE public.daily_topics ENABLE ROW LEVEL SECURITY;

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

-- Create trigger for updated_at on daily_topics
CREATE TRIGGER set_updated_at_daily_topics
BEFORE UPDATE ON public.daily_topics
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at(); 