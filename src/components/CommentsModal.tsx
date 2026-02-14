import { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { supabase, Comment } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type CommentsModalProps = {
  memeId: string;
  onClose: () => void;
};

export const CommentsModal = ({ memeId, onClose }: CommentsModalProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadComments();
    inputRef.current?.focus();
  }, [memeId]);

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(*)')
      .eq('meme_id', memeId)
      .order('created_at', { ascending: false });

    setComments(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setLoading(true);
    await supabase.from('comments').insert({
      user_id: user.id,
      meme_id: memeId,
      content: newComment.trim(),
    });

    setNewComment('');
    await loadComments();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gradient-to-b from-gray-900 to-black rounded-t-3xl border-t border-white/10 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">
            Comments ({comments.length})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No comments yet. Be the first!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <img
                  src={
                    comment.profiles.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.profiles.username}`
                  }
                  alt={comment.profiles.username}
                  className="w-8 h-8 rounded-full border border-white/10"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">
                      {comment.profiles.display_name || comment.profiles.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-pink-500/50"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
