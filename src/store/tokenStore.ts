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

interface TokenStore {
  tokens: CombinedTokenData[];
  setTokens: (tokens: CombinedTokenData[]) => void;
  allTokens: CombinedTokenData[];
  setAllTokens: (tokens: CombinedTokenData[]) => void;
}

export const useTokenStore = create<TokenStore>((set) => ({
  tokens: [],
  allTokens: [],
  setTokens: (tokens) => set({ tokens }),
  setAllTokens: (tokens) => set({ allTokens: tokens }),
}));
