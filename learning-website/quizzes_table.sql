-- Create quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID NOT NULL,
    student_id UUID NOT NULL,
    topic_id TEXT NOT NULL,
    topic_type TEXT NOT NULL,
    topic_name TEXT NOT NULL,
    questions JSONB,
    answers JSONB,
    score NUMERIC,
    strengths TEXT[],
    weaknesses TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'assigned'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quizzes_mentor_id ON public.quizzes(mentor_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_student_id ON public.quizzes(student_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON public.quizzes(status);

-- Enable Row Level Security
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Create policies for quizzes
CREATE POLICY "Mentors can view quizzes they created" 
    ON public.quizzes FOR SELECT 
    USING (mentor_id = auth.uid());

CREATE POLICY "Students can view quizzes assigned to them" 
    ON public.quizzes FOR SELECT 
    USING (student_id = auth.uid());

CREATE POLICY "Mentors can insert quizzes" 
    ON public.quizzes FOR INSERT 
    WITH CHECK (mentor_id = auth.uid());

CREATE POLICY "Mentors can update quizzes they created" 
    ON public.quizzes FOR UPDATE 
    USING (mentor_id = auth.uid());

CREATE POLICY "Students can update quizzes assigned to them" 
    ON public.quizzes FOR UPDATE 
    USING (student_id = auth.uid());

CREATE POLICY "Mentors can delete quizzes they created" 
    ON public.quizzes FOR DELETE 
    USING (mentor_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_quizzes
BEFORE UPDATE ON public.quizzes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT ALL PRIVILEGES ON public.quizzes TO anon;
GRANT ALL PRIVILEGES ON public.quizzes TO authenticated;
GRANT ALL PRIVILEGES ON public.quizzes TO service_role; 