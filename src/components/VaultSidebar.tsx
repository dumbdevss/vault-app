
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Briefcase, 
  ArrowLeftRight, 
  Send, 
  Sparkles,
  Image,
  Settings
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const VaultLogo = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" fill="black"/>
    <path d="M20 33.3457L13.1092 27.2829C8.23529 22.9945 0 26.0259 0 32.0888V40.0001H40V15.7487L20 33.3457Z" fill="#00FF77"/>
    <path d="M20 6.65435L26.8908 12.7172C31.7647 17.0056 40 13.9741 40 7.91128V0H0V24.2514L20 6.65435Z" fill="#00FF77"/>
  </svg>
);

interface NavItem {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const VaultSidebar = () => {

  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();

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
    <aside 
      className={`vault-sidebar fixed left-0 top-0 h-screen border-r border-sidebar-border z-40 transition-all duration-300 ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className={`flex items-center transition-all duration-300 ${
            !isExpanded ? 'justify-center' : 'space-x-3'
          }`}>
            <div className="flex-shrink-0">
              <VaultLogo />
            </div>
            <div className={`transition-all duration-300 overflow-hidden ${
              !isExpanded ? 'w-0 opacity-0' : 'w-auto opacity-100'
            }`}>
              <span className="text-xl font-bold text-sidebar-foreground whitespace-nowrap">Vault</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center py-3 px-3 rounded-lg transition-all duration-300 ${
                isActive(item.path) 
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                  : 'hover:bg-sidebar-accent text-sidebar-foreground'
              } ${!isExpanded ? 'justify-center' : 'space-x-3'}`}
            >
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                <item.icon className="h-5 w-5" />
              </div>
              <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                !isExpanded ? 'w-0 opacity-0' : 'w-auto opacity-100'
              }`}>
                {item.title}
              </span>
            </Link>
          ))}
        </nav>

        {/* Settings */}
        <div className="p-3 border-t border-sidebar-border">
          <div className={`flex items-center transition-all duration-300 ${
            !isExpanded ? 'justify-center' : 'justify-start'
          }`}>
            <Settings className="h-5 w-5" />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default VaultSidebar;
