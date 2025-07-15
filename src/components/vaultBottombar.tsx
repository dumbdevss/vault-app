import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Briefcase, ArrowLeftRight, Send, Sparkles, Image } from 'lucide-react';

interface NavItem {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const VaultBottombar = () => {
  const location = useLocation();

  const navItems: NavItem[] = [
    { title: 'Portfolio', path: '/', icon: Briefcase },
    { title: 'Swap', path: '/swap', icon: ArrowLeftRight },
    { title: 'Send', path: '/send', icon: Send },
    { title: 'Platforms', path: '/platforms', icon: Sparkles },
    { title: 'NFTs', path: '/nfts', icon: Image },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="mobile-bottom-nav z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.slice(0, 5).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default VaultBottombar;
