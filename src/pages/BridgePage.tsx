import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import WormholeConnect, {AutomaticCCTPRoute, AutomaticTokenBridgeRoute, type config, WormholeConnectTheme } from '@wormhole-foundation/wormhole-connect';


const BridgePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('layerzero');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // LayerZero configuration
  customElements.whenDefined('aptos-bridge').then(() => {

    const theme = {
      palette: {
        mode: 'dark',
        primary: { main: 'hsla(148, 100.00%, 50.00%, 0.5)' },
        secondary: { main: 'hsl(0, 0%, 9%)' },
        text: { primary: 'hsl(0, 0%, 90%)', secondary: 'hsl(0, 0%, 64%)' },
        background: { paper: 'hsl(0, 0%, 10%)', default: 'hsl(0, 0%, 7%)' },
        error: { main: 'hsl(0, 84%, 60%)' },
        success:{ main: 'hsl(148, 100%, 50%)' },
      },
      shape: { borderRadius: 12 },
      typography: { fontFamily: '"Roboto", sans-serif' },
    };
    document.querySelector('aptos-bridge')?.setTheme(theme);
  });

  // Wormhole configuration
  const wormholeConfig:  config.WormholeConnectConfig = {
    network: 'Mainnet',
    ui: {
      title: 'Bridge to Aptos',
      defaultInputs: { toChain: 'Aptos' },
      menu: [
        {
          label: 'Bridge Portal',
          href: 'https://portalbridge.com',
          target: '_self',
          order: 1,
        },
      ],
    },
  };

  const wormholeTheme: WormholeConnectTheme = {
    mode: 'dark',
    primary: 'hsl(148, 100%, 50%)',
    secondary: 'hsl(0, 0%, 9%)',
    text: 'hsl(0, 0%, 90%)',
    textSecondary: 'hsl(0, 0%, 64%)',
    error: 'hsl(0, 84%, 60%)',
    success: 'hsl(148, 100%, 50%)',
    input: 'hsl(0, 0%, 12%)',
    font: '"Roboto", sans-serif',
  };

  return (
    <div className="text-[hsl(0,0%,90%)]">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Cross-Chain Bridge to Aptos</h1>

        {error && (
          <div className="bg-[hsl(0,84%,60%)] text-white p-4 rounded-[0.75rem] mb-6">
            {error}
          </div>
        )}

        <Tabs defaultValue="layerzero" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md mb-8 bg-[hsl(0,0%,9%)] rounded-[0.75rem] p-1">
            <TabsTrigger value="layerzero" className="data-[state=active]:bg-[hsl(148,100%,50%)] data-[state=active]:text-black">
              LayerZero
            </TabsTrigger>
            <TabsTrigger value="wormhole" className="data-[state=active]:bg-[hsl(148,100%,50%)] data-[state=active]:text-black">
              Wormhole
            </TabsTrigger>
          </TabsList>

          <TabsContent value="layerzero" className="mt-6">
            <div className="bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,12%)] rounded-[0.75rem] p-6">
              <h2 className="text-2xl font-semibold mb-4">LayerZero Bridge to Aptos</h2>
              <p className="text-[hsl(0,0%,64%)] mb-6">
                Bridge your assets to Aptos using LayerZero's omnichain interoperability protocol. Secure, trustless cross-chain transfers from any supported network.
              </p>
              {isLoading && <div className="text-center">Loading...</div>}
              <div className="w-full rounded-[0.75rem] overflow-hidden">
                <aptos-bridge />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="wormhole" className="mt-6">
            <div className="bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,12%)] rounded-[0.75rem] p-6">
              <h2 className="text-2xl font-semibold mb-4">Wormhole Bridge to Aptos</h2>
              <p className="text-[hsl(0,0%,64%)] mb-6">
                Bridge your assets to Aptos using Wormhole's generic message passing protocol. Connect from multiple blockchains with secure cross-chain functionality.
              </p>
              {isLoading && <div className="text-center">Loading...</div>}
              <div className="w-full min-h-[600px] rounded-[0.75rem] overflow-hidden">
                <WormholeConnect config={wormholeConfig} theme={wormholeTheme} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BridgePage;