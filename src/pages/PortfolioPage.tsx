import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WalletSelector as ShadcnWalletSelector } from "@/components/WalletSelector";
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Percent, ExternalLink } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import { toHexString } from '@/lib';
import { useTokenStore } from '@/store/tokenStore';

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

interface TokenListItem {
  chainId: number;
  panoraId: string;
  tokenAddress: string;
  faAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  bridge: string;
  panoraSymbol: string;
  usdPrice: string;
  logoUrl: string;
  websiteUrl: string | null;
  panoraUI: boolean;
  panoraTags: string[];
  panoraIndex: number;
  coinGeckoId: string | null;
  coinMarketCapId: string | null;
  isInPanoraTokenList: boolean;
  isBanned: boolean;
}

interface NFT {
  token_data_id: string;
  amount: number;
  token_name: string;
  token_uri: string;
  collection_name: string;
  floor_price?: string;
}

interface DeFiPosition {
  protocol: string;
  type: 'Liquidity' | 'Perps' | 'Lending' | 'Staking';
  amount: string;
  value: string;
  apy: number;
  chain: string;
}

const PortfolioPage = () => {
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

  const GET_USER_NFTS = `
    query GetUserNFTs($owner_address: String!) {
      current_token_ownerships_v2(
        where: {
          owner_address: { _eq: $owner_address },
          amount: { _gt: 0 },
          is_fungible_v2: { _eq: false }
        }
      ) {
        token_data_id
        amount
        current_token_data {
          token_name
          token_uri
          token_properties
          collection_id
          current_collection {
            collection_name
            creator_address
            description
            uri
          }
        }
      }
    }
  `;

  const { account, connected, network } = useWallet();

  const { setPortfolioTokens } = useTokenStore();

  const ownerAddress = account?.address && typeof account.address === 'object' && 'data' in account.address 
    ? toHexString((account.address as any).data)
    : account?.address;

  const aptosIndexerUrl = network?.name === 'testnet'
    ? import.meta.env.VITE_APTOS_TESTNET_INDEXER
    : import.meta.env.VITE_APTOS_MAINNET_INDEXER;

  const panoraApiKey = import.meta.env.VITE_PANORA_API_KEY;

  // Fetch token balances
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
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data.current_fungible_asset_balances as TokenBalance[];
    },
    enabled: connected && !!ownerAddress,
  });

  const assetTypes = balances?.map((b) => b.asset_type) || [];

  // Fetch token metadata and prices for all assets
  const { data: tokenList, isLoading: tokenListLoading, error: tokenListError } = useQuery({
    queryKey: ['tokenList', assetTypes, network],
    queryFn: async () => {
      if (assetTypes.length === 0 || !panoraApiKey) {
        return [];
      }
      const query = { panoraUI: 'true', chainId: (network?.name === 'mainnet' ? 1 : 2).toString(), tokenAddress: assetTypes.join(',') }; // Note: API may support filtering by tokenAddress
      const queryString = new URLSearchParams(query);
      const url = `https://api.panora.exchange/tokenlist?${queryString}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'x-api-key': panoraApiKey },
      });
      if (!response.ok) {
        throw new Error(`Panora token list API error: ${response.statusText}`);
      }
      let result = await response.json();
      console.log(result);
      return result.data as TokenListItem[];
    },
    enabled: assetTypes.length > 0 && !!panoraApiKey,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 20 * 60 * 1000, // Keep in cache for 20 minutes
  });

  // Fetch NFTs
  const { data: nfts, isLoading: nftsLoading, error: nftsError } = useQuery({
    queryKey: ['userNFTs', ownerAddress, network],
    queryFn: async () => {
      if (!ownerAddress || !aptosIndexerUrl) {
        throw new Error('Wallet address or indexer URL missing');
      }
      const response = await fetch(aptosIndexerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: GET_USER_NFTS,
          variables: { owner_address: ownerAddress },
        }),
      });
      if (!response.ok) {
        throw new Error(`Indexer API error: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data.current_token_ownerships_v2.map((nft: any) => ({
        token_data_id: nft.token_data_id,
        amount: nft.amount,
        token_name: nft.current_token_data.token_name,
        token_uri: nft.current_token_data.token_uri,
        collection_name: nft.current_token_data.current_collection.collection_name,
      })) as NFT[];
    },
    enabled: connected && !!ownerAddress,
  });

  // Combine token data
  const combinedData = balances?.map((balance) => {
    const tokenInfo = tokenList?.find((t) => t.faAddress === balance.asset_type || t.tokenAddress === balance.asset_type);
    return {
      ...balance,
      symbol: tokenInfo?.symbol || balance.metadata?.symbol || 'Unknown',
      name: tokenInfo?.name || balance.metadata?.name || 'Unknown Token',
      decimals: tokenInfo?.decimals || balance.metadata?.decimals || 0,
      usdPrice: tokenInfo?.usdPrice || '0',
      icon_uri: tokenInfo?.logoUrl || balance.metadata?.icon_uri || '',
      tokenAddress: balance.asset_type,
    };
  }) || [];

  useEffect(() => {
    setPortfolioTokens(combinedData);
  }, [JSON.stringify(combinedData)]);

  // Calculate total portfolio value
  const totalPortfolioValue = combinedData.reduce((acc, token) => {
    const value = token.usdPrice && token.decimals
      ? parseFloat(token.usdPrice) * (token.amount / Math.pow(10, token.decimals))
      : 0;
    return acc + value;
  }, 0);

  const [selectedTab, setSelectedTab] = useState<'tokens' | 'nfts' | 'defi'>('tokens');

  // Mock DeFi positions
  const mockDeFiPositions: DeFiPosition[] = [
    {
      protocol: 'Cetus',
      type: 'Liquidity',
      amount: '1,000 SUI + 3,850 USDC',
      value: '$7,700.00',
      apy: 12.5,
      chain: 'Sui',
    },
    {
      protocol: 'Pancake Swap',
      type: 'Liquidity',
      amount: '200 APT + 800 USDC',
      value: '$1,600.00',
      apy: 15.3,
      chain: 'Aptos',
    },
  ];

  const isLoading = balancesLoading || tokenListLoading || nftsLoading;
  const hasError = balancesError || tokenListError || nftsError;

  if (!connected) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold">Connect your wallet to see your portfolio</h2>
        <ShadcnWalletSelector />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold text-red-500">Error loading portfolio data</h2>
        <p className="text-muted-foreground">Please try again later or check your network connection.</p>
      </div>
    );
  }

  // JSX remains unchanged
  return (
    <div className="w-full space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <Card className="lg:col-span-2 vault-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <DollarSign className="h-5 w-5 text-primary" />
              <span>Total Portfolio Value</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ) : (
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">
                  ${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <p className="text-sm text-muted-foreground">Excludes NFT and DeFi values</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="vault-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-1">
                <Skeleton className="h-7 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-2xl font-bold">{combinedData.length}</p>
                <p className="text-sm text-muted-foreground">Assets</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="vault-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">NFTs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-1">
                <Skeleton className="h-7 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-2xl font-bold">{nfts?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Items</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as "tokens" | "nfts" | "defi")} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="tokens">Tokens</TabsTrigger>  
          <TabsTrigger value="nfts">NFTs</TabsTrigger>
          <TabsTrigger value="defi">DeFi</TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="space-y-4 w-full">
          {isLoading ? (
            <div className="grid gap-4 w-full">
              {[...Array(3)].map((_, index) => (
                <Card key={index} className="vault-card">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 items-center w-full">
                      <div className="flex items-center space-x-3 col-span-1">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[80px]" />
                          <Skeleton className="h-4 w-[50px]" />
                        </div>
                      </div>
                      <div className="text-right col-span-2 space-y-2">
                        <Skeleton className="h-4 w-[100px] ml-auto" />
                        <Skeleton className="h-4 w-[70px] ml-auto" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : combinedData.length === 0 ? (
            <p className="text-center text-muted-foreground">No tokens found in your wallet.</p>
          ) : (
            <div className="grid gap-4 w-full">
              {combinedData.map((token) => {
                const balance = token.decimals
                  ? (token.amount / Math.pow(10, token.decimals)).toFixed(4)
                  : '0';
                const value = token.usdPrice && token.decimals
                  ? (parseFloat(token.usdPrice) * (token.amount / Math.pow(10, token.decimals))).toFixed(2)
                  : '0.00';

                return (
                  <Card key={token.asset_type} className="vault-card hover:bg-accent/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 items-center w-full">
                        <div className="flex items-center space-x-3 col-span-1">
                          <img
                            src={token.icon_uri}
                            alt={token.symbol}
                            className="m-0 p-0 w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <h3 className="font-medium">{token.symbol}</h3>
                            <p className="text-sm text-muted-foreground">{token.name}</p>
                          </div>
                        </div>
                        <div className="text-right col-span-2">
                          <p className="font-medium">{balance} {token.symbol}</p>
                          <p className="text-sm text-muted-foreground">${value}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="nfts" className="space-y-4 w-full">
          {nftsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {[...Array(3)].map((_, index) => (
                <Card key={index} className="vault-card">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <Skeleton className="aspect-square w-full rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-[80px]" />
                        <Skeleton className="h-4 w-[60px]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !nfts || nfts.length === 0 ? (
            <p className="text-center text-muted-foreground">No NFTs found in your wallet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {nfts.map((nft) => (
                <Card key={nft.token_data_id} className="vault-card">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                        <img
                          src={nft.token_uri}
                          alt={nft.token_name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.textContent = '🖼️';
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{nft.token_name}</h3>
                        <p className="text-sm text-muted-foreground">{nft.collection_name}</p>
                        <p className="text-sm font-medium mt-1">
                          {nft.floor_price ? `Floor: ${nft.floor_price}` : 'Floor: N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="defi" className="space-y-4 w-full">
          <div className="grid gap-4 w-full">
            {mockDeFiPositions.map((position, index) => (
              <Card key={index} className="vault-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between w-full">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{position.protocol}</h3>
                        <Badge variant="secondary">{position.type}</Badge>
                        <Badge variant="outline">{position.chain}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{position.amount}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-medium">{position.value}</p>
                      <div className="flex items-center space-x-1 text-primary">
                        <Percent className="h-3 w-3" />
                        <span className="text-sm font-medium">{position.apy}% APY</span>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PortfolioPage;