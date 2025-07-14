
import React, { ReactNode } from 'react';
import VaultSidebar from '../VaultSidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface VaultLayoutProps {
  children: ReactNode;
}

const VaultLayout = ({ children }: VaultLayoutProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />
      <div className={`${isMobile ? 'pt-20 pb-20' : 'ml-16'}`}>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default VaultLayout;
