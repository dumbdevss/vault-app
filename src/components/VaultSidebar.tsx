
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Briefcase, 
  ArrowLeftRight, 
  Send, 
  Sparkles,
  Image,
  Settings,
  Menu,
  X
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
  const [isSticky, setIsSticky] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
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

  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <VaultLogo />
            <span className="text-xl font-bold">Vault</span>
          </div>
          <button 
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 text-foreground"
          >
            {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Overlay Menu */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm">
            <div className="pt-20 px-6">
              <nav className="space-y-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center space-x-3 py-3 px-4 rounded-lg transition-colors ${
                      isActive(item.path) 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-accent text-foreground'
                    }`}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-lg">{item.title}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <div className="mobile-bottom-nav">
          <div className="flex items-center justify-around py-2">
            {navItems.slice(0, 4).map((item) => (
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
      </>
    );
  }

  return (
    <aside 
      className={`vault-sidebar fixed left-0 top-0 h-screen border-r border-sidebar-border z-40 ${
        isSticky ? 'sticky' : 'expanded'
      }`}
      onMouseEnter={() => isSticky && setIsExpanded(true)}
      onMouseLeave={() => isSticky && setIsExpanded(false)}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className={`flex items-center ${isSticky && !isExpanded ? 'justify-center' : 'space-x-3'}`}>
            <VaultLogo />
            <div className={`transition-opacity duration-200 ${
              isSticky && !isExpanded ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            }`}>
              <span className="text-xl font-bold text-sidebar-foreground">Vault</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center py-3 px-4 rounded-lg transition-all duration-200 ${
                isActive(item.path) 
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                  : 'hover:bg-sidebar-accent text-sidebar-foreground'
              } ${isSticky && !isExpanded ? 'justify-center' : 'space-x-3'}`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className={`transition-opacity duration-200 ${
                isSticky && !isExpanded ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
              }`}>
                {item.title}
              </span>
            </Link>
          ))}
        </nav>

        {/* Settings */}
        <div className="p-3 border-t border-sidebar-border">
          <div className={`flex items-center ${isSticky && !isExpanded ? 'justify-center' : 'justify-between'}`}>
            <button
              onClick={() => setIsSticky(!isSticky)}
              className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
              title={isSticky ? 'Disable Sticky Mode' : 'Enable Sticky Mode'}
            >
              <Settings className="h-5 w-5" />
            </button>
            <div className={`transition-opacity duration-200 ${
              isSticky && !isExpanded ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            }`}>
              <span className="text-sm text-sidebar-foreground">
                {isSticky ? 'Sticky' : 'Expanded'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default VaultSidebar;
