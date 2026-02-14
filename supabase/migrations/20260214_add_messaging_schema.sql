/*
  # Add Messaging and Calling Schema

  ## New Tables
  
  ### `conversations`
  - `id` (uuid, primary key)
  - `participant_ids` (uuid array)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `messages`
  - `id` (uuid, primary key)
  - `conversation_id` (uuid, references conversations)
  - `sender_id` (uuid, references profiles)
  - `content` (text)
  - `created_at` (timestamptz)
  
  ### `calls`
  - `id` (uuid, primary key)
  - `caller_id` (uuid, references profiles)
  - `callee_id` (uuid, references profiles)
  - `call_type` (text: 'audio' or 'video')
  - `status` (text: 'pending', 'accepted', 'ended', 'declined')
  - `started_at` (timestamptz)
  - `ended_at` (timestamptz)
  
  ## Security
  - Enable RLS on all tables
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids uuid[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = ANY(participant_ids));

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE auth.uid() = ANY(participant_ids)
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations WHERE auth.uid() = ANY(participant_ids)
    )
  );

-- Create calls table
CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  callee_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  call_type text NOT NULL CHECK (call_type IN ('audio', 'video')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'ended', 'declined')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their calls"
  ON calls FOR SELECT
  TO authenticated
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY "Users can create calls"
  ON calls FOR INSERT
  TO authenticated
  WITH CHECK (caller_id = auth.uid());

CREATE POLICY "Users can update their calls"
  ON calls FOR UPDATE
  TO authenticated
  USING (auth.uid() = caller_id OR auth.uid() = callee_id)
  WITH CHECK (auth.uid() = caller_id OR auth.uid() = callee_id);
