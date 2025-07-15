
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, ExternalLink, TrendingUp, Droplets, Zap, Shield } from 'lucide-react';

const PlatformsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const platforms = [
    {
      name: 'Cetus Protocol',
      description: 'Concentrated liquidity DEX on Sui',
      category: 'DEX',
      chain: 'Sui',
      tvl: '$125M',
      apy: '12.5%',
      type: 'Liquidity',
      logo: '🌊',
      features: ['Concentrated Liquidity', 'Low Fees', 'High Yield']
    },
    {
      name: 'Turbos Finance',
      description: 'Advanced trading platform on Sui',
      category: 'DEX',
      chain: 'Sui',
      tvl: '$89M',
      apy: '8.9%',
      type: 'Trading',
      logo: '🚀',
      features: ['Advanced Trading', 'Limit Orders', 'Analytics']
    },
    {
      name: 'Aftermath',
      description: 'Liquid staking protocol on Sui',
      category: 'Staking',
      chain: 'Sui',
      tvl: '$45M',
      apy: '6.2%',
      type: 'Staking',
      logo: '⚡',
      features: ['Liquid Staking', 'Auto-compound', 'Governance']
    },
    {
      name: 'Merkle Trade',
      description: 'Perpetual futures trading',
      category: 'Perps',
      chain: 'Multi-chain',
      tvl: '$78M',
      apy: '15.3%',
      type: 'Perps',
      logo: '📈',
      features: ['Perpetual Futures', 'Leverage Trading', 'Cross-margin']
    },
    {
      name: 'PancakeSwap',
      description: 'Leading DEX on multiple chains',
      category: 'DEX',
      chain: 'Aptos',
      tvl: '$1.2B',
      apy: '15.3%',
      type: 'Liquidity',
      logo: '🥞',
      features: ['Farms', 'Pools', 'Lottery']
    },
    {
      name: 'Thala',
      description: 'Omnichain liquidity protocol',
      category: 'DeFi',
      chain: 'Aptos',
      tvl: '$234M',
      apy: '11.8%',
      type: 'Liquidity',
      logo: '🔱',
      features: ['Omnichain', 'Stable Pools', 'Yield Farming']
    },
    {
      name: 'Cellana Finance',
      description: 'Next-gen AMM on Aptos',
      category: 'DEX',
      chain: 'Aptos',
      tvl: '$156M',
      apy: '9.4%',
      type: 'Trading',
      logo: '🧬',
      features: ['Advanced AMM', 'Vote Escrow', 'Bribes']
    }
  ];

  const categories = [
    { id: 'all', name: 'All', icon: Sparkles },
    { id: 'DEX', name: 'DEX', icon: Droplets },
    { id: 'Staking', name: 'Staking', icon: Shield },
    { id: 'Perps', name: 'Perps', icon: TrendingUp },
    { id: 'DeFi', name: 'DeFi', icon: Zap }
  ];

  const filteredPlatforms = selectedCategory === 'all' 
    ? platforms 
    : platforms.filter(p => p.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">DeFi Platforms</h1>
        </div>
        <p className="text-muted-foreground">
          Discover and interact with leading DeFi protocols across multiple chains
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            onClick={() => setSelectedCategory(category.id)}
            className="flex items-center space-x-2"
          >
            <category.icon className="h-4 w-4" />
            <span>{category.name}</span>
          </Button>
        ))}
      </div>

      {/* Platform Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPlatforms.map((platform, index) => (
          <Card key={index} className="vault-card hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{platform.logo}</div>
                  <div>
                    <CardTitle className="text-lg">{platform.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{platform.description}</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{platform.category}</Badge>
                <Badge variant="outline">{platform.chain}</Badge>
                <Badge variant="outline">{platform.type}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">TVL</p>
                  <p className="font-bold text-lg">{platform.tvl}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">APY</p>
                  <p className="font-bold text-lg text-primary">{platform.apy}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Features</p>
                <div className="flex flex-wrap gap-1">
                  {platform.features.map((feature, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button className="flex-1 vault-button">
                  Connect
                </Button>
                <Button variant="outline" className="flex-1">
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PlatformsPage;
