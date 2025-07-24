
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import VaultLayout from "./components/layout/VaultLayout";
import PortfolioPage from "./pages/PortfolioPage";
import SwapPage from "./pages/SwapPage";
import SendPage from "./pages/SendPage";
import PlatformsPage from "./pages/PlatformsPage";
import NFTsPage from "./pages/NFTsPage";
import NotFoundPage from './pages/not_found';
import HyperionPage from './pages/platforms/hyperion';
import LiquidSwapPage from './pages/platforms/liquidswap';
import TappExchangePage from './pages/platforms/tappexchange';
import { useEffect } from "react";
import { useTokenStore } from "./store/tokenStore";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toHexString } from '@/lib';
import tokens from '@/utils/tokens.json';

interface TokenBalance {
  asset_type: string;
  amount: number;
  last_transaction_timestamp: string;
  metadata: TokenMetadata;
}

interface TokenMetadata {
  icon_uri?: string;
  name: string;
  symbol: string;
  decimals: number;
}

// Application main component
const App = () => {

  const { account, connected, network } = useWallet();

  const ownerAddress = account?.address && typeof account.address === 'object' && 'data' in account.address 
    ? toHexString((account.address as any).data)
    : account?.address;

  const { setAppBalances } = useTokenStore();

  const GET_USER_TOKEN_BALANCE = `
  query GetUserTokenBalance($owner_address: String!) {
    current_fungible_asset_balances(
      where: { owner_address: { _eq: $owner_address } }
    ) {
      asset_type
      amount
      last_transaction_timestamp
      metadata {
        icon_uri
        name
        symbol
        decimals
      }
    }
  }
`;

  const aptosIndexerUrl = network?.name === 'testnet'
    ? import.meta.env.VITE_APTOS_TESTNET_INDEXER
    : import.meta.env.VITE_APTOS_MAINNET_INDEXER;

  const { data: balances, isLoading: balancesLoading, error: balancesError } = useQuery({
    queryKey: ['fungibleAssetBalances', ownerAddress, network],
    queryFn: async () => {
      if (!ownerAddress || !aptosIndexerUrl) {
        throw new Error('Wallet address or indexer URL missing');
      }
      const response = await fetch(aptosIndexerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: GET_USER_TOKEN_BALANCE,
          variables: { owner_address: ownerAddress },
        }),
      });
      if (!response.ok) {
        throw new Error(`Indexer API error: ${response.statusText}`);
      }
      const result = await response.json();
      console.log(result);
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data.current_fungible_asset_balances as TokenBalance[];
    },
    enabled: connected && !!ownerAddress,
  });

  useEffect(() => {
    if (balances) {
      const appBalances = new Map<string, number>();
      balances.forEach((balance) => {
        appBalances.set(tokens.find((token) => (token.tokenAddress === balance.asset_type || token.faAddress === balance.asset_type))?.faAddress, balance.amount);
      });
      setAppBalances(appBalances);
    }
  }, [balances, account?.address, connected]);

  useEffect(() => {
    // Force dark mode
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <BrowserRouter>
      <TooltipProvider>
        <VaultLayout>
          <Routes>
            <Route path="/" element={<PortfolioPage />} />
            <Route path="/swap" element={<SwapPage />} />
            <Route path="/send" element={<SendPage />} />
            <Route path="/platforms" element={<PlatformsPage />}>
              <Route path="hyperion" element={<HyperionPage />} />
              <Route path="liquidswap" element={<LiquidSwapPage />} />
              <Route path="tappexchange" element={<TappExchangePage />} />
            </Route>
            <Route path="/nfts" element={<NFTsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </VaultLayout>
      </TooltipProvider>
    </BrowserRouter>
  );
};

export default App;
