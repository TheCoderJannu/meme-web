import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LogOut, Edit2, Camera, Save, X, Image as ImageIcon } from 'lucide-react';

export const Profile = () => {

  const { user, profile, signOut } = useAuth();

  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showViewer, setShowViewer] = useState(false);
  const [userMemes, setUserMemes] = useState<any[]>([]);
  const [loadingMemes, setLoadingMemes] = useState(true);

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      loadUserMemes();
    }
  }, [user?.id]);

  const loadUserMemes = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('memes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setUserMemes(data || []);
    } catch (error) {
      console.error('Error loading user memes:', error);
    } finally {
      setLoadingMemes(false);
    }
  };

  // ✅ SUPER FIXED UPLOAD FUNCTION
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {

    if (!e.target.files || !user) return;

    const file = e.target.files[0];

    // instant preview BEFORE upload (makes UI feel fast)
    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);

    const filePath = `avatars/${user.id}-${Date.now()}`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '0',
        upsert: true
      });

    if (error) {
      console.log("UPLOAD ERROR:", error);
      return;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // cache bust trick (forces reload)
    const finalUrl = data.publicUrl + `?t=${Date.now()}`;

    console.log("FINAL URL:", finalUrl);

    setAvatarUrl(finalUrl);
  };

  const saveProfile = async () => {

    if (!user) return;

    await supabase.from('profiles')
      .update({
        bio,
        avatar_url: avatarUrl
      })
      .eq('id', user.id);

    setEditing(false);
  };

  return (

    <div className="min-h-screen bg-black pt-20 pb-24">

      <div className="max-w-lg mx-auto px-4">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">

          <div className="flex items-center gap-4">

            {/* AVATAR */}
            <div className="relative">

              {avatarUrl ? (

                <img
                  key={avatarUrl}   // 🔥 force React refresh
                  src={avatarUrl}
                  onClick={() => setShowViewer(true)}
                  className="w-20 h-20 rounded-full object-cover border-2 border-white/20 cursor-pointer"
                />

              ) : (

                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-gray-400 border-2 border-white/20">
                  Upload
                </div>

              )}

              {editing && (

                <label className="absolute bottom-0 right-0 bg-black/70 p-2 rounded-full cursor-pointer">

                  <Camera className="w-4 h-4 text-white"/>

                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleAvatarUpload}
                  />

                </label>

              )}

            </div>

            <div>
              <h1 className="text-2xl font-bold text-white">
                {profile?.display_name || profile?.username}
              </h1>
              <p className="text-gray-400">@{profile?.username}</p>
            </div>

          </div>

          <div className="flex gap-2">

            <button
              onClick={() => editing ? saveProfile() : setEditing(true)}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            >
              {editing ? <Save className="w-5 h-5"/> : <Edit2 className="w-5 h-5"/>}
            </button>

            <button
              onClick={signOut}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <LogOut className="w-5 h-5"/>
            </button>

          </div>

        </div>

        {/* BIO */}
        {editing ? (
          <textarea
            value={bio}
            onChange={(e)=>setBio(e.target.value)}
            className="w-full bg-white/5 text-white p-3 rounded-xl mb-6"
          />
        ) : bio && (
          <p className="text-gray-300 mb-6">{bio}</p>
        )}

        {/* USER POSTS SECTION */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-6">
            <ImageIcon className="w-5 h-5 text-pink-500" />
            <h3 className="text-xl font-bold text-white">My Posts</h3>
            <span className="ml-auto text-sm text-gray-400">{userMemes.length}</span>
          </div>

          {loadingMemes ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
            </div>
          ) : userMemes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No posts yet. Upload your first meme!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {userMemes.map((meme) => (
                <div
                  key={meme.id}
                  className="group relative overflow-hidden rounded-xl cursor-pointer"
                >
                  <img
                    src={meme.image_url}
                    alt={meme.caption}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex flex-col justify-end p-3">
                    <p className="text-white text-xs line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {meme.caption}
                    </p>
                    {meme.category && (
                      <p className="text-gray-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        {meme.category}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FULLSCREEN VIEWER */}
        {showViewer && (

          <div
            onClick={()=>setShowViewer(false)}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          >

            <img
              src={avatarUrl}
              className="max-w-[90%] max-h-[90%] rounded-xl"
            />

            <X className="absolute top-5 right-5 text-white"/>

          </div>

        )}

      </div>

    </div>
  );
};