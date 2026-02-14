import { useState, useRef } from 'react';
import { Upload as UploadIcon, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type UploadProps = {
  onSuccess: () => void;
};

export const Upload = ({ onSuccess }: UploadProps) => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('dank');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['dank', 'wholesome', 'cursed', 'relatable', 'general'];

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('memes')
        .upload(fileName, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('memes')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('memes').insert({
        user_id: user.id,
        image_url: publicUrl,
        caption,
        category,
      });

      if (insertError) {
        throw insertError;
      }

      setSelectedFile(null);
      setPreview('');
      setCaption('');
      setCategory('dank');
      onSuccess();
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-32 pb-24 px-4">
      <div className="max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Upload Meme</h2>

        {!preview ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-pink-500 bg-pink-500/10'
                : 'border-white/20 hover:border-pink-500/50 bg-white/5'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                <UploadIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold mb-1">
                  Drop your meme here
                </p>
                <p className="text-gray-400 text-sm">
                  or click to browse
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10">
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreview('');
                }}
                className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={preview}
                alt="Preview"
                className="w-full h-auto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a funny caption..."
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                      category === cat
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Post Meme'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
