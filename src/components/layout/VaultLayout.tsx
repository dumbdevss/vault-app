
import React, { ReactNode } from 'react';
import VaultSidebar from '../VaultSidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface VaultLayoutProps {
  children: ReactNode;
}

const VaultLayout = ({ children }: VaultLayoutProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen">
      <VaultSidebar />
      <div className={`main-content transition-all duration-300 ${isMobile ? 'pt-20 pb-20' : 'ml-16'}`}>
        <main className="container mx-auto p-6 max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  );
};

export default VaultLayout;
