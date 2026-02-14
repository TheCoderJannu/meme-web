/*
  # Add Follows Schema

  ## New Tables
  
  ### `follows`
  - `id` (uuid, primary key)
  - `follower_id` (uuid, references profiles)
  - `following_id` (uuid, references profiles)
  - `created_at` (timestamptz)
  - Unique constraint on (follower_id, following_id)
  
  ## Security
  - Enable RLS on follows table
*/

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
