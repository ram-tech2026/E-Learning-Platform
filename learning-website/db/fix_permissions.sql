-- Fix permissions for the Learning Website database tables
-- Run this script to ensure proper permissions are set

-- Grant permissions for profiles table
GRANT ALL PRIVILEGES ON profiles TO anon;
GRANT ALL PRIVILEGES ON profiles TO authenticated;
GRANT ALL PRIVILEGES ON profiles TO service_role;

-- Grant permissions for career_paths table
GRANT ALL PRIVILEGES ON career_paths TO anon;
GRANT ALL PRIVILEGES ON career_paths TO authenticated;
GRANT ALL PRIVILEGES ON career_paths TO service_role;

-- Grant permissions for career_milestones table
GRANT ALL PRIVILEGES ON career_milestones TO anon;
GRANT ALL PRIVILEGES ON career_milestones TO authenticated;
GRANT ALL PRIVILEGES ON career_milestones TO service_role;

-- Grant permissions for daily_topics table
GRANT ALL PRIVILEGES ON daily_topics TO anon;
GRANT ALL PRIVILEGES ON daily_topics TO authenticated;
GRANT ALL PRIVILEGES ON daily_topics TO service_role;

-- Grant permissions for sequences
GRANT USAGE, SELECT ON SEQUENCE profiles_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE profiles_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE profiles_id_seq TO service_role;

GRANT USAGE, SELECT ON SEQUENCE career_paths_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE career_paths_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE career_paths_id_seq TO service_role;

GRANT USAGE, SELECT ON SEQUENCE career_milestones_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE career_milestones_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE career_milestones_id_seq TO service_role;

GRANT USAGE, SELECT ON SEQUENCE daily_topics_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE daily_topics_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE daily_topics_id_seq TO service_role;

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_topics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policies for career_paths
CREATE POLICY "Users can view their own career paths"
  ON career_paths FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own career paths"
  ON career_paths FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own career paths"
  ON career_paths FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own career paths"
  ON career_paths FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for career_milestones
CREATE POLICY "Users can view their own milestones"
  ON career_milestones FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM career_paths
    WHERE career_paths.id = career_milestones.career_path_id
    AND career_paths.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert milestones for their career paths"
  ON career_milestones FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM career_paths
    WHERE career_paths.id = career_milestones.career_path_id
    AND career_paths.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own milestones"
  ON career_milestones FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM career_paths
    WHERE career_paths.id = career_milestones.career_path_id
    AND career_paths.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own milestones"
  ON career_milestones FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM career_paths
    WHERE career_paths.id = career_milestones.career_path_id
    AND career_paths.user_id = auth.uid()
  ));

-- Create RLS policies for daily_topics
CREATE POLICY "Users can view their own daily topics"
  ON daily_topics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily topics"
  ON daily_topics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily topics"
  ON daily_topics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily topics"
  ON daily_topics FOR DELETE
  USING (auth.uid() = user_id);

-- Commit the changes
COMMIT; 