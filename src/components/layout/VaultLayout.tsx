import React, { ReactNode } from 'react';
import { isMainnet } from '@/lib';
import { useIsMobile } from '@/hooks/use-mobile';
import VaultSidebar from '../VaultSidebar';
import { WalletSelector as ShadcnWalletSelector } from "@/components/WalletSelector";
import VaultTopbar from '../vaultTopbar';
import VaultBottombar from '../vaultBottombar';
import { Network } from '@aptos-labs/ts-sdk';
import { useToast } from "@/components/ui/use-toast";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

interface VaultLayoutProps {
  children: ReactNode;
}

const VaultLayout = ({ children }: VaultLayoutProps) => {
  const { connected, network, changeNetwork } = useWallet();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleNetworkSwitch = async () => {
    if (!network) return;
    const targetNetwork = isMainnet(connected, network?.name) ? Network.TESTNET : Network.MAINNET;
    try {
      await changeNetwork(targetNetwork);
    } catch (error) {
    toast({
      variant: "destructive",
      title: "Error",
      description: error || "Failed to switch network",
    });
    console.error('Failed to switch network:', error);
    }
  };

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

          {connected && isMainnet(connected, network?.name) && (
            <button
              onClick={handleNetworkSwitch}
              className="py-2 px-4 bg-gray-700 text-white rounded-md hover:bg-gray-600 mr-4"
            >
              Switch to {isMainnet(connected, network?.name) ? 'Testnet' : 'Mainnet'}
            </button>
          )}
          <ShadcnWalletSelector />
        </header>
        <main className="w-full min-h-screen">
          <div className="container mx-auto p-6 max-w-[1000px]">
            {children}
          </div>
        </main>
        {/* {connected && (
          <>
            <div className="flex items-center space-x-4">
              <TransactionParameters />
              <SingleSigner />
              <Sponsor />
              <MultiAgent />
            </div>
          </>
        )} */}
      </div>
    </div>
  );
};

export default VaultLayout;

