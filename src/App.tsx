import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { MemeFeed } from './components/MemeFeed';
import { Upload } from './components/Upload';
import { Profile } from './components/Profile';
import { Explore } from './components/Explore';
import { Chat } from './components/Chat';
import { BottomNav } from './components/BottomNav';
import { TopBar } from './components/TopBar';

type Tab = 'home' | 'explore' | 'upload' | 'profile' | 'chat';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [activeFilter, setActiveFilter] = useState('For You');

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const handleUploadSuccess = () => {
    setActiveTab('home');
    setActiveFilter('For You');
  };

  return (
    <div className="min-h-screen bg-black">
      {activeTab === 'home' && (
        <>
          <TopBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          <div className="pt-32">
            <MemeFeed filter={activeFilter} />
          </div>
        </>
      )}

      {activeTab === 'explore' && <Explore />}
      {activeTab === 'upload' && <Upload onSuccess={handleUploadSuccess} />}
      {activeTab === 'profile' && <Profile />}
      {activeTab === 'chat' && <Chat onClose={() => setActiveTab('home')} />}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
