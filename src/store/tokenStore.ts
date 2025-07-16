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
  tokens: CombinedTokenData[];
  setTokens: (tokens: CombinedTokenData[]) => void;
  allTokens: TokenData[];
  setAllTokens: (tokens: TokenData[]) => void;
}

export const useTokenStore = create<TokenStore>((set) => ({
  tokens: [],
  allTokens: [],
  setTokens: (tokens) => set({ tokens }),
  setAllTokens: (tokens) => set({ allTokens: tokens }),
}));
