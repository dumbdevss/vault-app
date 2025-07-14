
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image, Search, Filter, Grid3X3, List, ExternalLink, Heart } from 'lucide-react';

const NFTsPage = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChain, setSelectedChain] = useState('all');

  const collections = [
    {
      name: 'Sui Warriors',
      floor: '15.5 SUI',
      volume: '1,234 SUI',
      items: 5000,
      chain: 'Sui',
      image: '⚔️'
    },
    {
      name: 'Aptos Apes',
      floor: '8.2 APT',
      volume: '892 APT',
      items: 3333,
      chain: 'Aptos',
      image: '🐒'
    },
    {
      name: 'Sui Punks',
      floor: '22.1 SUI',
      volume: '2,156 SUI',
      items: 2222,
      chain: 'Sui',
      image: '🎨'
    }
  ];

  const myNFTs = [
    {
      name: 'Sui Warrior #1234',
      collection: 'Sui Warriors',
      image: '⚔️',
      chain: 'Sui',
      lastPrice: '15.5 SUI',
      rarity: 'Rare'
    },
    {
      name: 'Aptos Ape #567',
      collection: 'Aptos Apes',
      image: '🐒',
      chain: 'Aptos',
      lastPrice: '8.2 APT',
      rarity: 'Common'
    },
    {
      name: 'Sui Punk #89',
      collection: 'Sui Punks',
      image: '🎨',
      chain: 'Sui',
      lastPrice: '22.1 SUI',
      rarity: 'Legendary'
    },
    {
      name: 'Crystal Guardian #445',
      collection: 'Crystal Guardians',
      image: '💎',
      chain: 'Sui',
      lastPrice: '12.8 SUI',
      rarity: 'Epic'
    }
  ];

  const activityFeed = [
    { type: 'Sale', nft: 'Sui Warrior #999', price: '16.2 SUI', time: '2 hours ago' },
    { type: 'Listing', nft: 'Aptos Ape #123', price: '9.5 APT', time: '4 hours ago' },
    { type: 'Transfer', nft: 'Sui Punk #456', price: '-', time: '6 hours ago' },
    { type: 'Sale', nft: 'Crystal Guardian #777', price: '14.1 SUI', time: '8 hours ago' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <Image className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">NFTs</h1>
        </div>
        <p className="text-muted-foreground">
          Discover, collect, and trade NFTs across multiple chains
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search collections, NFTs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedChain} onValueChange={setSelectedChain}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Chain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Chains</SelectItem>
            <SelectItem value="Sui">Sui</SelectItem>
            <SelectItem value="Aptos">Aptos</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="my-nfts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-nfts">My NFTs</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="my-nfts" className="space-y-6">
          <div className={`grid gap-4 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {myNFTs.map((nft, index) => (
              <Card key={index} className="vault-card hover:bg-accent/50 transition-colors cursor-pointer group">
                <CardContent className="p-4">
                  {viewMode === 'grid' ? (
                    <div className="space-y-3">
                      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">
                        {nft.image}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium truncate">{nft.name}</h3>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">{nft.collection}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{nft.rarity}</Badge>
                          <Badge variant="secondary">{nft.chain}</Badge>
                        </div>
                        <p className="text-sm font-medium">Last: {nft.lastPrice}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4 p-2">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center text-2xl">
                        {nft.image}
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-medium">{nft.name}</h3>
                        <p className="text-sm text-muted-foreground">{nft.collection}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">{nft.rarity}</Badge>
                          <Badge variant="secondary" className="text-xs">{nft.chain}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{nft.lastPrice}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="collections" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection, index) => (
              <Card key={index} className="vault-card hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-6xl">
                      {collection.image}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">{collection.name}</h3>
                        <Badge variant="outline">{collection.chain}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Floor</p>
                          <p className="font-medium">{collection.floor}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Volume</p>
                          <p className="font-medium">{collection.volume}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {collection.items.toLocaleString()} items
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="vault-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityFeed.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center space-x-3">
                      <Badge variant={
                        activity.type === 'Sale' ? 'default' :
                        activity.type === 'Listing' ? 'secondary' : 'outline'
                      }>
                        {activity.type}
                      </Badge>
                      <div>
                        <p className="font-medium">{activity.nft}</p>
                        <p className="text-sm text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {activity.price !== '-' && (
                        <p className="font-medium">{activity.price}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NFTsPage;
