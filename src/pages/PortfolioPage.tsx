
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent,
  ExternalLink,
  Image,
  Coins
} from 'lucide-react';

interface Token {
  symbol: string;
  name: string;
  balance: string;
  value: string;
  change24h: number;
  icon: string;
}

interface NFT {
  name: string;
  collection: string;
  image: string;
  floorPrice: string;
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
  const [selectedTab, setSelectedTab] = useState('tokens');

  const mockTokens: Token[] = [
    {
      symbol: 'SUI',
      name: 'Sui',
      balance: '1,250.50',
      value: '$3,851.25',
      change24h: 5.2,
      icon: '🔵'
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      balance: '2,500.00',
      value: '$2,500.00',
      change24h: 0.1,
      icon: '💵'
    },
    {
      symbol: 'APT',
      name: 'Aptos',
      balance: '450.75',
      value: '$1,892.15',
      change24h: -2.8,
      icon: '🅰️'
    }
  ];

  const mockNFTs: NFT[] = [
    {
      name: 'Sui Warrior #1234',
      collection: 'Sui Warriors',
      image: '🖼️',
      floorPrice: '15.5 SUI'
    },
    {
      name: 'Aptos Ape #567',
      collection: 'Aptos Apes',
      image: '🎨',
      floorPrice: '8.2 APT'
    }
  ];

  const mockDeFiPositions: DeFiPosition[] = [
    {
      protocol: 'Cetus',
      type: 'Liquidity',
      amount: '1,000 SUI + 3,850 USDC',
      value: '$7,700.00',
      apy: 12.5,
      chain: 'Sui'
    },
    {
      protocol: 'Turbos Finance',
      type: 'Liquidity',
      amount: '500 SUI + 1,925 USDC',
      value: '$3,850.00',
      apy: 8.9,
      chain: 'Sui'
    },
    {
      protocol: 'Aftermath',
      type: 'Staking',
      amount: '750 SUI',
      value: '$2,310.00',
      apy: 6.2,
      chain: 'Sui'
    },
    {
      protocol: 'Pancake Swap',
      type: 'Liquidity',
      amount: '200 APT + 800 USDC',
      value: '$1,600.00',
      apy: 15.3,
      chain: 'Aptos'
    }
  ];

  const totalPortfolioValue = '$23,803.40';
  const totalChange24h = 3.8;

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span>Total Portfolio Value</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">{totalPortfolioValue}</h2>
              <div className={`flex items-center space-x-1 ${
                totalChange24h >= 0 ? 'text-primary' : 'text-destructive'
              }`}>
                {totalChange24h >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {totalChange24h >= 0 ? '+' : ''}{totalChange24h}% (24h)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{mockTokens.length}</p>
              <p className="text-sm text-muted-foreground">Assets</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">DeFi Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{mockDeFiPositions.length}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tokens" className="flex items-center space-x-2">
            <Coins className="h-4 w-4" />
            <span>Tokens</span>
          </TabsTrigger>
          <TabsTrigger value="nfts" className="flex items-center space-x-2">
            <Image className="h-4 w-4" />
            <span>NFTs</span>
          </TabsTrigger>
          <TabsTrigger value="defi" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>DeFi</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="space-y-4">
          <div className="grid gap-4">
            {mockTokens.map((token, index) => (
              <Card key={index} className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{token.icon}</div>
                      <div>
                        <h3 className="font-medium">{token.symbol}</h3>
                        <p className="text-sm text-muted-foreground">{token.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{token.balance} {token.symbol}</p>
                      <p className="text-sm text-muted-foreground">{token.value}</p>
                    </div>
                    <div className={`text-right ${
                      token.change24h >= 0 ? 'text-primary' : 'text-destructive'
                    }`}>
                      <div className="flex items-center space-x-1">
                        {token.change24h >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="font-medium">
                          {token.change24h >= 0 ? '+' : ''}{token.change24h}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="nfts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockNFTs.map((nft, index) => (
              <Card key={index} className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-4xl">
                      {nft.image}
                    </div>
                    <div>
                      <h3 className="font-medium">{nft.name}</h3>
                      <p className="text-sm text-muted-foreground">{nft.collection}</p>
                      <p className="text-sm font-medium mt-1">Floor: {nft.floorPrice}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="defi" className="space-y-4">
          <div className="grid gap-4">
            {mockDeFiPositions.map((position, index) => (
              <Card key={index} className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
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
