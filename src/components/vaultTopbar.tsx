import React from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';
import { WalletSelector as ShadcnWalletSelector } from "@/components/WalletSelector";
import { MultiAgent } from "@/components/transactionFlows/MultiAgent";
import { SingleSigner } from "@/components/transactionFlows/SingleSigner";
import { Sponsor } from "@/components/transactionFlows/Sponsor";
import { TransactionParameters } from "@/components/transactionFlows/TransactionParameters";
import { init as initTelegram } from '@telegram-apps/sdk';
import { isMainnet } from '@/lib';

const VaultLogo = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" fill="black" />
    <path
      d="M20 33.3457L13.1092 27.2829C8.23529 22.9945 0 26.0259 0 32.0888V40.0001H40V15.7487L20 33.3457Z"
      fill="#00FF77"
    />
    <path
      d="M20 6.65435L26.8908 12.7172C31.7647 17.0056 40 13.9741 40 7.91128V0H0V24.2514L20 6.65435Z"
      fill="#00FF77"
    />
  </svg>
);

// Initialize Telegram Mini App if running in Telegram Webview
const isTelegramMiniApp =
  typeof window !== 'undefined' && (window as any).TelegramWebviewProxy !== undefined;
if (isTelegramMiniApp) {
  initTelegram();
}

const VaultTopbar = () => {
  const { account, connected, network, wallet, changeNetwork } = useWallet();

  // Function to handle network switching (e.g., between Mainnet and Testnet)
  const handleNetworkSwitch = async () => {
    if (!network) return;
    const targetNetwork = isMainnet(network.name) ? Network.TESTNET : Network.MAINNET;
    try {
      await changeNetwork(targetNetwork);
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black p-4 flex items-center justify-between">
      {/* Logo and Title */}
      <div className="flex items-center space-x-2">
        <VaultLogo />
        <span className="text-xl hidden sm:block font-bold text-white">Vault</span>
      </div>

      {/* Right-side Controls */}
      <div className="flex items-center space-x-4">
        {/* Wallet Connection Button */}
        <ShadcnWalletSelector />

        {/* Network Switch Button */}
        {connected && network && (
          <button
            onClick={handleNetworkSwitch}
            className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Switch to {isMainnet(network.name) ? 'Testnet' : 'Mainnet'}
          </button>
        )}

        {/* Transaction Flow Components (visible when wallet is connected) */}
        {connected && (
          <>
            <div className="flex items-center space-x-4">
              <TransactionParameters />
              <SingleSigner />
              <Sponsor />
              <MultiAgent />
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default VaultTopbar;