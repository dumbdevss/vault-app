
import React, { ReactNode } from 'react';
import VaultSidebar from '../VaultSidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface VaultLayoutProps {
  children: ReactNode;
}

const VaultLayout = ({ children }: VaultLayoutProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen flex">
      <VaultSidebar />
      <div className={`flex-1 transition-all duration-300 ${
        isMobile ? 'pt-20 pb-20' : 'pl-16'
      }`}>
        <main className="w-full min-h-screen">
          <div className="container mx-auto p-6 max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default VaultLayout;
