import React from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

import { WalletSelector as ShadcnWalletSelector } from "@/components/WalletSelector";

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
  const { connected } = useWallet();

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


      </div>
    </header>
  );
};

export default VaultTopbar;