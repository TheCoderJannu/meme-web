/*
  # Create Meme App Schema

  ## New Tables
  
  ### `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `username` (text, unique)
  - `display_name` (text)
  - `avatar_url` (text)
  - `bio` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `memes`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `image_url` (text)
  - `caption` (text)
  - `category` (text)
  - `view_count` (integer)
  - `created_at` (timestamptz)
  
  ### `likes`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `meme_id` (uuid, references memes)
  - `created_at` (timestamptz)
  - Unique constraint on (user_id, meme_id)
  
  ### `comments`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `meme_id` (uuid, references memes)
  - `content` (text)
  - `created_at` (timestamptz)
  
  ### `saves`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `meme_id` (uuid, references memes)
  - `created_at` (timestamptz)
  - Unique constraint on (user_id, meme_id)
  
  ## Security
  - Enable RLS on all tables
  - Profiles: Users can read all, update own
  - Memes: Users can read all, create own, update/delete own
  - Likes: Users can read all, create/delete own
  - Comments: Users can read all, create own, update/delete own
  - Saves: Users can read own, create/delete own
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  bio text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create memes table
CREATE TABLE IF NOT EXISTS memes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  caption text DEFAULT '',
  category text DEFAULT 'general',
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE memes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view memes"
  ON memes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own memes"
  ON memes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memes"
  ON memes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memes"
  ON memes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  meme_id uuid REFERENCES memes(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, meme_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own likes"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  meme_id uuid REFERENCES memes(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create saves table
CREATE TABLE IF NOT EXISTS saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  meme_id uuid REFERENCES memes(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, meme_id)
);

ALTER TABLE saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saves"
  ON saves FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own saves"
  ON saves FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saves"
  ON saves FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_memes_user_id ON memes(user_id);
CREATE INDEX IF NOT EXISTS idx_memes_created_at ON memes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memes_category ON memes(category);
CREATE INDEX IF NOT EXISTS idx_likes_meme_id ON likes(meme_id);
CREATE INDEX IF NOT EXISTS idx_comments_meme_id ON comments(meme_id);
CREATE INDEX IF NOT EXISTS idx_saves_user_id ON saves(user_id);