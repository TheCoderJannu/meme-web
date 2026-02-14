import { useState, useEffect, useCallback } from 'react';
import { supabase, Meme } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MemeCard } from './MemeCard';
import { Loader2 } from 'lucide-react';

type MemeFeedProps = {
  filter: string;
};

export const MemeFeed = ({ filter }: MemeFeedProps) => {
  const { user } = useAuth();
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadMemes = useCallback(async (pageNum: number, reset: boolean = false) => {
    if (!user) return;

    setLoading(true);
    const pageSize = 10;
    const from = pageNum * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('memes')
      .select(
        `
        *,
        profiles(*),
        likes(count),
        comments(count),
        likes!inner(user_id)
      `
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filter !== 'For You' && filter !== 'Trending') {
      query = query.eq('category', filter.toLowerCase());
    }

    const { data, error } = await query;

    if (!error && data) {
      const memesWithCounts = await Promise.all(
        data.map(async (meme) => {
          const { count: likesCount } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('meme_id', meme.id);

          const { count: commentsCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('meme_id', meme.id);

          const { data: likeData } = await supabase
            .from('likes')
            .select('id')
            .eq('meme_id', meme.id)
            .eq('user_id', user.id)
            .maybeSingle();

          const { data: saveData } = await supabase
            .from('saves')
            .select('id')
            .eq('meme_id', meme.id)
            .eq('user_id', user.id)
            .maybeSingle();

          return {
            ...meme,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            is_liked: !!likeData,
            is_saved: !!saveData,
          };
        })
      );

      if (reset) {
        setMemes(memesWithCounts);
      } else {
        setMemes((prev) => [...prev, ...memesWithCounts]);
      }

      setHasMore(data.length === pageSize);
    }

    setLoading(false);
  }, [user, filter]);

  useEffect(() => {
    setPage(0);
    setMemes([]);
    loadMemes(0, true);
  }, [filter]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.target as HTMLDivElement;
    const scrollPercentage =
      (element.scrollTop + element.clientHeight) / element.scrollHeight;

    if (scrollPercentage > 0.8 && !loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadMemes(nextPage);
    }
  }, [loading, hasMore, page, loadMemes]);

  const handleUpdate = () => {
    loadMemes(0, true);
  };

  if (loading && memes.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (memes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white px-4">
        <p className="text-xl mb-2">No memes yet</p>
        <p className="text-gray-400 text-center">
          Be the first to upload some fire content!
        </p>
      </div>
    );
  }

  return (
    <div
      className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      onScroll={handleScroll}
    >
      {memes.map((meme) => (
        <MemeCard key={meme.id} meme={meme} onUpdate={handleUpdate} />
      ))}
      {loading && (
        <div className="flex items-center justify-center h-screen bg-black">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      )}
    </div>
  );
};
