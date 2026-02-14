import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, X } from 'lucide-react';

type User = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
};

type MessageUsersProps = {
  onUserSelect?: (userId: string) => void;
  onClose?: () => void;
};

export const MessageUsers = ({ onUserSelect, onClose }: MessageUsersProps) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center z-50">
      <div className="bg-gray-900 rounded-t-2xl md:rounded-2xl w-full md:w-96 max-h-[90vh] flex flex-col border border-white/10">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Message Users</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-white/10">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 border border-white/20 focus:border-pink-500 outline-none transition"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p>{searchQuery ? 'No users found' : 'Search to find users to message'}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onUserSelect?.(u.id)}
                  className="w-full p-4 hover:bg-white/5 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt={u.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                        {u.username[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{u.display_name || u.username}</p>
                      <p className="text-sm text-gray-400 truncate">@{u.username}</p>
                      {u.bio && <p className="text-xs text-gray-500 truncate">{u.bio}</p>}
                    </div>
                    <MessageCircle className="w-5 h-5 text-pink-500 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
