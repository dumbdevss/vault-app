import { create } from 'zustand';

export interface CombinedTokenData {
  asset_type: string;
  amount: number;
  symbol: string;
  name: string;
  decimals: number;
  usdPrice: string;
  icon_uri: string;
  tokenAddress: string;
}

export interface TokenData {
  chainId: number;
  tokenAddress: string;
  faAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  bridge: string | null;
  panoraSymbol: string;
  logoUrl: string;
  websiteUrl: string;
  panoraUI: boolean;
  panoraTags: string[];
  panoraIndex: number;
  coinGeckoId: string | null;
  coinMarketCapId: string | null;
}

interface TokenStore {
  allTokens: TokenData[];
  setAllTokens: (tokens: TokenData[]) => void;
  setPortfolioTokens: (tokens: any[]) => void;
  portfolioTokens: any[];
  balances: Map<string, number>;
  appBalances: Map<string, number>;
  setAppBalances: (balances: Map<string, number>) => void;
  setBalances: (balances: Map<string, number>) => void;
}

export const useTokenStore = create<TokenStore>((set) => ({
  allTokens: [],
  setAllTokens: (tokens) => set({ allTokens: tokens }),
  setPortfolioTokens(tokens) {
    set({ portfolioTokens: tokens });
  },
  portfolioTokens: [],
  balances: new Map(),
  appBalances: new Map(),
  setAppBalances: (balances) => set({ appBalances: balances }),
  setBalances: (balances) => set({ balances }),
}));
