import { useState, useEffect } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, MessageCircle } from 'lucide-react';

export const Explore = () => {
  const { user } = useAuth();
  const [trendingUsers, setTrendingUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTrendingUsers();
    loadFollowingUsers();
  }, [user?.id]);

  const loadTrendingUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id || '')
        .limit(20);

      setTrendingUsers(data || []);
    } catch (error) {
      console.error('Error loading trending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowingUsers = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingSet = new Set((data || []).map(f => f.following_id));
      setFollowingUsers(followingSet);
    } catch (error) {
      console.error('Error loading following users:', error);
    }
  };

  const toggleFollow = async (userId: string) => {
    if (!user) return;

    try {
      const isFollowing = followingUsers.has(userId);

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;
        
        const newFollowing = new Set(followingUsers);
        newFollowing.delete(userId);
        setFollowingUsers(newFollowing);
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId,
          });

        if (error) throw error;

        const newFollowing = new Set(followingUsers);
        newFollowing.add(userId);
        setFollowingUsers(newFollowing);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Failed to update follow status');
    }
  };

  const startMessaging = async (userId: string) => {
    if (!user) return;

    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [user.id, userId])
        .single();

      if (existing) {
        setSelectedUserId(userId);
        return;
      }

      // Create new conversation
      const { error } = await supabase
        .from('conversations')
        .insert({
          participant_ids: [user.id, userId],
        });

      if (error) throw error;
      setSelectedUserId(userId);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-32 pb-24 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-pink-500" />
          <h2 className="text-2xl font-bold text-white">Trending Creators</h2>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : (
          <div className="space-y-3">
            {trendingUsers.map((trendUser, index) => {
              const isFollowing = followingUsers.has(trendUser.id);
              return (
                <div
                  key={trendUser.id}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={
                          trendUser.avatar_url ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${trendUser.username}`
                        }
                        alt={trendUser.username}
                        className="w-12 h-12 rounded-full border-2 border-white/20"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">
                        {trendUser.display_name || trendUser.username}
                      </p>
                      <p className="text-sm text-gray-400">@{trendUser.username}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => startMessaging(trendUser.id)}
                        className="p-2 rounded-full hover:bg-white/10 transition-all"
                        title="Message"
                      >
                        <MessageCircle className="w-5 h-5 text-pink-500" />
                      </button>
                      <button 
                        onClick={() => toggleFollow(trendUser.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          isFollowing
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg hover:shadow-pink-500/50'
                        }`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  </div>
                  {trendUser.bio && (
                    <p className="mt-3 text-sm text-gray-300 line-clamp-2">
                      {trendUser.bio}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
