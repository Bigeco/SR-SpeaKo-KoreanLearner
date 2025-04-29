import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Book, Mic, Video, BarChart, Home } from 'lucide-react';

export const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation items with their paths and icons
  const navItems = [
    { path: '/', icon: Home, label: '홈' }, 
    { path: '/subtitle', icon: Book, label: '발음' }, // 임시?
    { path: '/start-record', icon: Mic, label: '녹음' },
    { path: '/reels', icon: Video, label: '릴스' },
    { path: '/progress', icon: BarChart, label: '진행도' }, // 임시?
  ];

  // Check if a path is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="h-16 border-t border-gray-200 flex justify-around items-center bg-white">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        
        return (
          <button 
            key={item.path}
            className="flex flex-col items-center justify-center"
            onClick={() => navigate(item.path)}
          >
            <Icon 
              size={24} 
              className={active ? 'text-blue-600' : 'text-gray-500'} 
            />
            <span 
              className={`text-xs mt-1 ${
                active ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
