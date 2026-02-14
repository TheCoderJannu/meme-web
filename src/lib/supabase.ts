import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string;
  created_at: string;
  updated_at: string;
};

export type Meme = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string;
  category: string;
  view_count: number;
  created_at: string;
  profiles: Profile;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  is_saved?: boolean;
};

export type Comment = {
  id: string;
  user_id: string;
  meme_id: string;
  content: string;
  created_at: string;
  profiles: Profile;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type Conversation = {
  id: string;
  participant_ids: string[];
  created_at: string;
  updated_at: string;
};

export type Call = {
  id: string;
  caller_id: string;
  callee_id: string;
  call_type: 'audio' | 'video';
  status: 'pending' | 'accepted' | 'ended' | 'declined';
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
};
