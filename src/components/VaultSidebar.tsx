
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Briefcase, 
  ArrowLeftRight, 
  Send, 
  Sparkles,
  Image,
  Settings,
  Users,
  ArrowDownToLine,
  ArrowRightLeft
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const VaultLogo = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" fill="black"/>
    <path d="M20 33.3457L13.1092 27.2829C8.23529 22.9945 0 26.0259 0 32.0888V40.0001H40V15.7487L20 33.3457Z" fill="#00FF77"/>
    <path d="M20 6.65435L26.8908 12.7172C31.7647 17.0056 40 13.9741 40 7.91128V0H0V24.2514L20 6.65435Z" fill="#00FF77"/>
  </svg>
);

const BridgeIcon = ({ className }: { className?: string }) => (
  <svg className={`aries-design-icon ${className}`} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" preserveAspectRatio="xMidYMid">
    <path className="bridge_svg__item" d="M1000.727 584.145h-93.09V344.436c20.945 27.928 48.872 53.528 81.454 72.146 4.654 2.327 6.982 2.327 11.636 2.327 6.982 0 16.291-4.654 20.946-11.636 6.982-11.637 2.327-25.6-9.31-32.582-65.163-39.564-104.727-100.073-104.727-165.236 0-13.964-9.309-23.273-23.272-23.273h-93.091c-13.964 0-23.273 9.309-23.273 23.273 0 116.363-114.036 209.454-256 209.454s-256-93.09-256-209.454c0-13.964-9.31-23.273-23.273-23.273h-93.09c-13.964 0-23.273 9.309-23.273 23.273v2.327c0 65.163-37.237 125.673-104.728 165.236C0 381.673-2.327 395.636 2.327 407.273c4.655 6.982 13.964 11.636 20.946 11.636 4.654 0 6.982 0 11.636-2.327 32.582-20.946 60.51-44.218 81.455-72.146v237.382H23.273C11.636 581.818 0 591.128 0 605.091s9.31 23.273 23.273 23.273l93.09 2.327v160.582H93.092c-13.964 0-23.273 9.309-23.273 23.272s9.31 23.273 23.273 23.273h186.182c13.963 0 23.272-9.309 23.272-23.273s-9.309-23.272-23.272-23.272H256v-93.091c0-13.964-9.31-23.273-23.273-23.273s-23.272 9.31-23.272 23.273v93.09h-46.546V232.728h48.873C225.745 363.055 356.072 465.455 512 465.455s286.255-102.4 300.218-232.728h48.873v558.546h-46.546v-93.091c0-13.964-9.309-23.273-23.272-23.273S768 684.22 768 698.182v93.09h-23.273c-13.963 0-23.272 9.31-23.272 23.273s9.309 23.273 23.272 23.273H930.91c13.964 0 23.273-9.309 23.273-23.273s-9.31-23.272-23.273-23.272h-23.273V630.69h93.091c13.964 0 23.273-9.31 23.273-23.273s-9.31-23.273-23.273-23.273z" fill="currentColor"></path>
    <path className="bridge_svg__item" d="M814.545 607.418V395.636c0-13.963-9.309-23.272-23.272-23.272S768 381.673 768 395.636v188.51h-93.09v-95.419c0-13.963-9.31-23.272-23.274-23.272s-23.272 9.309-23.272 23.272v95.418h-93.091V512c0-13.964-9.31-23.273-23.273-23.273s-23.273 9.31-23.273 23.273v72.145h-93.09v-95.418c0-13.963-9.31-23.272-23.273-23.272s-23.273 9.309-23.273 23.272v95.418H256V395.636c0-13.963-9.31-23.272-23.273-23.272s-23.272 9.309-23.272 23.272v211.782c0 13.964 9.309 23.273 23.272 23.273h558.546c13.963 0 23.272-11.636 23.272-23.273z" fill="currentColor"></path>
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
    { title: 'Bridge', path: '/bridge', icon: BridgeIcon },
    { title: 'Send', path: '/send', icon: Send },
    { title: 'Payroll', path: '/payroll', icon: Users },
    { title: 'Off Ramp', path: '/off-ramp', icon: ArrowDownToLine },
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
