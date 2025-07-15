import React, { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import VaultSidebar from '../VaultSidebar';
import ConnectWalletButton from '../ConnectWalletButton';
import VaultTopbar from '../vaultTopbar';
import VaultBottombar from '../vaultBottombar';

interface VaultLayoutProps {
  children: ReactNode;
}

const VaultLayout = ({ children }: VaultLayoutProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col">
        <VaultTopbar />
        <main className="flex-1 pt-20 pb-20">
          <div className="container mx-auto p-6 max-w-[1000px]">
            {children}
          </div>
        </main>
        <VaultBottombar />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <VaultSidebar />
      <div className="flex-1 transition-all duration-300 pl-16">
        <header className="flex justify-end p-4">
          <ConnectWalletButton />
        </header>
        <main className="w-full min-h-screen">
          <div className="container mx-auto p-6 max-w-[1000px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default VaultLayout;

