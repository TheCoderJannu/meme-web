import { Sparkles } from 'lucide-react';

type TopBarProps = {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
};

export const TopBar = ({ activeFilter, onFilterChange }: TopBarProps) => {
  const filters = ['For You', 'Trending', 'Dank', 'Wholesome', 'Cursed'];

  return (
    <div className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-black/80 border-b border-white/10">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">MemeVibe</span>
          </div>
        </div>

        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
