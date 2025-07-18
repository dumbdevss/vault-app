import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Droplets, DollarSign, BarChart3, Shield } from 'lucide-react';
import protocols from '@/utils/protocols.json';
import {Skeleton} from '@/components/ui/skeleton';

const PlatformsPage = () => {
  const [protocolData, setProtocolData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();

  const categories = [
    { id: 'all', name: 'All', icon: Sparkles },
    { id: 'Perps', name: 'Perps', icon: TrendingUp },
    { id: 'Liquidity', name: 'Liquidity', icon: Droplets },
    { id: 'Yield Farming', name: 'Yield Farming', icon: DollarSign },
    { id: 'DEX', name: 'DEX', icon: BarChart3 },
    { id: 'Staking', name: 'Staking', icon: Shield }
  ];

  useEffect(() => {
    const fetchProtocolData = async () => {
      try {
        setLoading(true);
        const dataPromises = protocols.map(async (protocol) => {
          try {
            const protocolId = protocol.llama_id || protocol.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            
            // Fetch TVL data
            const tvlResponse = await fetch(`https://api.llama.fi/protocol/${protocolId}`);
            const tvlData = await tvlResponse.json();
            if (!tvlResponse.ok) throw new Error('TVL fetch failed');

            let query = {
              excludeTotalDataChart: 'false',
              excludeTotalDataChartBreakdown: 'false',
            };
            const queryString = new URLSearchParams(query);
            // Fetch volume data
            const volumeResponse = await fetch(`https://api.llama.fi/summary/dexs/${protocolId}?${queryString}`);
            const volumeData = await volumeResponse.json();
            if (!volumeResponse.ok) throw new Error('Volume fetch failed');

            const aptosTvls = tvlData.chainTvls?.Aptos?.tvl || [];
            const lastTwoTvls = aptosTvls.slice(-2);
            const change_1d = lastTwoTvls.length === 2 
              ? ((lastTwoTvls[1].totalLiquidityUSD - lastTwoTvls[0].totalLiquidityUSD) / lastTwoTvls[0].totalLiquidityUSD * 100)
              : 0;

            return {
              id: protocolId,
              tvl: tvlData.currentChainTvls?.Aptos || 0,
              volume24h: volumeData.total24h || 0,
              change_1d: isNaN(change_1d) ? 0 : change_1d
            };
          } catch (error) {
            console.error(`Error fetching data for ${protocol.name}:`, error);
            return {
              id: protocol.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
              tvl: 0,
              volume24h: 0,
              change_1d: 0
            };
          }
        });

        const results = await Promise.all(dataPromises);
        const dataMap = results.reduce((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {});
        setProtocolData(dataMap);
      } catch (error) {
        console.error('Error fetching protocol data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProtocolData();
  }, []);

  const formatNumber = (num) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  const filteredProtocols = selectedCategory === 'all'
    ? protocols
    : protocols.filter(p => p.category.includes(selectedCategory));

  const isPlatformDetailsPage = location.pathname.split('/').length > 2;

  if (isPlatformDetailsPage) {
    return <Outlet />;
  }

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



      <div className="flex items-center space-x-2 mb-4">
        {categories.map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'secondary' : 'outline'}
            onClick={() => setSelectedCategory(category.id)}
            className="capitalize flex items-center space-x-2"
          >
            <category.icon className="h-4 w-4" />
            <span>{category.name}</span>
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProtocols.map((protocol, index) => {
          const protocolId = protocol.llama_id || protocol.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          const data = protocolData[protocolId] || { tvl: 0, volume24h: 0, change_1d: 0 };
          const isPositiveChange = data.change_1d >= 0;

          return (
            <Card key={index} className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-md bg-white">
                    <img src={protocol.logo} alt={protocol.name} className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-lg">{protocol.name}</CardTitle>
                  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" className="size-6 text-primary" data-sentry-element="SealCheck" data-sentry-source-file="platforms-grid.tsx"><path d="M225.86,102.82c-3.77-3.94-7.67-8-9.14-11.57-1.36-3.27-1.44-8.69-1.52-13.94-.15-9.76-.31-20.82-8-28.51s-18.75-7.85-28.51-8c-5.25-.08-10.67-.16-13.94-1.52-3.56-1.47-7.63-5.37-11.57-9.14C146.28,23.51,138.44,16,128,16s-18.27,7.51-25.18,14.14c-3.94,3.77-8,7.67-11.57,9.14C88,40.64,82.56,40.72,77.31,40.8c-9.76.15-20.82.31-28.51,8S41,67.55,40.8,77.31c-.08,5.25-.16,10.67-1.52,13.94-1.47,3.56-5.37,7.63-9.14,11.57C23.51,109.72,16,117.56,16,128s7.51,18.27,14.14,25.18c3.77,3.94,7.67,8,9.14,11.57,1.36,3.27,1.44,8.69,1.52,13.94.15,9.76.31,20.82,8,28.51s18.75,7.85,28.51,8c5.25.08,10.67.16,13.94,1.52,3.56,1.47,7.63,5.37,11.57,9.14C109.72,232.49,117.56,240,128,240s18.27-7.51,25.18-14.14c3.94-3.77,8-7.67,11.57-9.14,3.27-1.36,8.69-1.44,13.94-1.52,9.76-.15,20.82-.31,28.51-8s7.85-18.75,8-28.51c.08-5.25.16-10.67,1.52-13.94,1.47-3.56,5.37-7.63,9.14-11.57C232.49,146.28,240,138.44,240,128S232.49,109.73,225.86,102.82Zm-52.2,6.84-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z"></path></svg>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <Skeleton className="h-6 w-full" />
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">TVL</span>
                      <div className="flex items-center space-x-1">
                        <span className="font-bold text-lg">{formatNumber(data.tvl)}</span>
                        {data.change_1d !== undefined && (
                          <span className={`text-xs ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositiveChange ? '+' : ''}{data.change_1d.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">VOLUME(24H)</span>
                      <span className="font-bold text-lg text-primary">
                        {formatNumber(data.volume24h)}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1"><span className="capitalize">{protocol.tag}</span></Button>
                  <Button onClick={() => navigate(`/platforms/${protocol.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`)} className="flex-1 bg-black text-white">Use on Vault</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PlatformsPage;