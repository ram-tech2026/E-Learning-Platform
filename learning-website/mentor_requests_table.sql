-- Create mentor_requests table
CREATE TABLE IF NOT EXISTS public.mentor_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID NOT NULL,
    student_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mentor_id, student_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mentor_requests_mentor_id ON public.mentor_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_requests_student_id ON public.mentor_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_mentor_requests_status ON public.mentor_requests(status);

-- Enable Row Level Security
ALTER TABLE public.mentor_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for mentor_requests
CREATE POLICY "Mentors can view requests involving them" 
    ON public.mentor_requests FOR SELECT 
    USING (mentor_id = auth.uid());

CREATE POLICY "Students can view requests they made" 
    ON public.mentor_requests FOR SELECT 
    USING (student_id = auth.uid());

CREATE POLICY "Students can insert mentor requests" 
    ON public.mentor_requests FOR INSERT 
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Mentors can update requests sent to them" 
    ON public.mentor_requests FOR UPDATE 
    USING (mentor_id = auth.uid());

CREATE POLICY "Students can update requests they made" 
    ON public.mentor_requests FOR UPDATE 
    USING (student_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_mentor_requests
BEFORE UPDATE ON public.mentor_requests
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT ALL PRIVILEGES ON public.mentor_requests TO anon;
GRANT ALL PRIVILEGES ON public.mentor_requests TO authenticated;
GRANT ALL PRIVILEGES ON public.mentor_requests TO service_role; 