import { Home, Compass, Upload, User, MessageCircle } from 'lucide-react';

type Tab = 'home' | 'explore' | 'upload' | 'profile' | 'chat';

type BottomNavProps = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const tabs = [
    { id: 'home' as Tab, icon: Home, label: 'Home' },
    { id: 'explore' as Tab, icon: Compass, label: 'Explore' },
    { id: 'upload' as Tab, icon: Upload, label: 'Upload' },
    { id: 'chat' as Tab, icon: MessageCircle, label: 'Chat' },
    { id: 'profile' as Tab, icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/80 border-t border-white/10">
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="flex justify-around items-center">
          {tabs.map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className="flex flex-col items-center gap-1 transition-all"
              >
                <div
                  className={`p-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/30'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`}
                  />
                </div>
                <span
                  className={`text-xs font-medium ${
                    isActive ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
