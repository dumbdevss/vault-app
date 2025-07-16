
import React from 'react';
import { createRoot } from 'react-dom/client';
import { AutoConnectProvider } from "@/components/AutoConnectProvider";
import { ReactQueryClientProvider } from "@/components/ReactQueryClientProvider";
import { TransactionSubmitterProvider } from "@/components/TransactionSubmitterProvider";
import { WalletProvider } from "@/components/WalletProvider";
import { Toaster } from './components/ui/toaster';

import App from './App';
import './index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <AutoConnectProvider>
      <TransactionSubmitterProvider>
        <ReactQueryClientProvider>
          <WalletProvider>
            <App />
            <Toaster />
          </WalletProvider>
        </ReactQueryClientProvider>
      </TransactionSubmitterProvider>
    </AutoConnectProvider>
  </React.StrictMode>
);
