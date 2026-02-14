import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Bookmark, Share2, MoreVertical } from 'lucide-react';
import { Meme } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CommentsModal } from './CommentsModal';

type MemeCardProps = {
  meme: Meme;
  onUpdate: () => void;
};

export const MemeCard = ({ meme, onUpdate }: MemeCardProps) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(meme.is_liked || false);
  const [isSaved, setIsSaved] = useState(meme.is_saved || false);
  const [likesCount, setLikesCount] = useState(meme.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(meme.comments_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setIsLiked(meme.is_liked || false);
    setIsSaved(meme.is_saved || false);
    setLikesCount(meme.likes_count || 0);
    setCommentsCount(meme.comments_count || 0);
  }, [meme]);

  const handleLike = async () => {
    if (!user) return;

    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount((prev) => (newLikedState ? prev + 1 : prev - 1));

    if (newLikedState) {
      await supabase.from('likes').insert({ user_id: user.id, meme_id: meme.id });
    } else {
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('meme_id', meme.id);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const newSavedState = !isSaved;
    setIsSaved(newSavedState);

    if (newSavedState) {
      await supabase.from('saves').insert({ user_id: user.id, meme_id: meme.id });
    } else {
      await supabase
        .from('saves')
        .delete()
        .eq('user_id', user.id)
        .eq('meme_id', meme.id);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Check out this meme!',
        text: meme.caption,
        url: window.location.href,
      });
    }
  };

  return (
    <>
      <div className="relative w-full h-screen snap-start snap-always">
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          {!imageLoaded && (
            <div className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
          )}
          <img
            src={meme.image_url}
            alt={meme.caption}
            className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pb-24">
          <div className="flex items-start gap-3 mb-4">
            <img
              src={
                meme.profiles.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${meme.profiles.username}`
              }
              alt={meme.profiles.username}
              className="w-10 h-10 rounded-full border-2 border-white/20"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">
                  {meme.profiles.display_name || meme.profiles.username}
                </span>
                <span className="text-xs text-gray-400">
                  @{meme.profiles.username}
                </span>
              </div>
              <p className="text-white text-sm mt-1">{meme.caption}</p>
            </div>
            <button className="text-gray-400 hover:text-white transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="absolute right-4 bottom-32 flex flex-col gap-4">
          <button
            onClick={handleLike}
            className="flex flex-col items-center gap-1 transition-transform active:scale-90"
          >
            <div
              className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                isLiked
                  ? 'bg-pink-500 shadow-lg shadow-pink-500/50'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <Heart
                className={`w-6 h-6 ${
                  isLiked ? 'text-white fill-white' : 'text-white'
                }`}
              />
            </div>
            <span className="text-white text-xs font-semibold">
              {likesCount}
            </span>
          </button>

          <button
            onClick={() => setShowComments(true)}
            className="flex flex-col items-center gap-1 transition-transform active:scale-90"
          >
            <div className="w-12 h-12 rounded-full backdrop-blur-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-semibold">
              {commentsCount}
            </span>
          </button>

          <button
            onClick={handleSave}
            className="flex flex-col items-center gap-1 transition-transform active:scale-90"
          >
            <div
              className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                isSaved
                  ? 'bg-purple-500 shadow-lg shadow-purple-500/50'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <Bookmark
                className={`w-6 h-6 ${
                  isSaved ? 'text-white fill-white' : 'text-white'
                }`}
              />
            </div>
          </button>

          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1 transition-transform active:scale-90"
          >
            <div className="w-12 h-12 rounded-full backdrop-blur-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <Share2 className="w-6 h-6 text-white" />
            </div>
          </button>
        </div>
      </div>

      {showComments && (
        <CommentsModal
          memeId={meme.id}
          onClose={() => {
            setShowComments(false);
            onUpdate();
          }}
        />
      )}
    </>
  );
};
