import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUp, ArrowDown } from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import protocols from "@/utils/protocols.json";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { aptosClient, toHexString } from "@/lib";
import { SDK, convertValueToDecimal } from "@pontem/liquidswap-sdk";
import { Skeleton } from "@/components/ui/skeleton";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Label } from "@/components/ui/label";

// Define interfaces based on the new API response
interface ApiCoin {
  type: string;
  decimals: number;
  logoUrl: string;
  name: string;
  symbol: string;
}

interface ApiPool {
  version: number;
  curve: "unstable" | "stable";
  coinX: ApiCoin;
  coinY: ApiCoin;
  type: string; // This can serve as poolId
  normalizedFee: number;
  tvl: string;
  apr: number;
  volume24: number;
}

// Interfaces for component structure
interface TokenInfo {
  coinType: string;
  symbol: string;
  decimals: number;
  logoUrl?: string;
  name: string;
}

interface Pool {
  poolId: string;
  token1: string;
  token2: string;
  token1Info: TokenInfo;
  token2Info: TokenInfo;
  curveType: "uncorrelated" | "stable";
  version: 0 | 0.5;
  tvlUSD: number;
  dailyVolumeUSD: number;
  feeRate: string;
}

interface PoolItem {
  id: string;
  feeAPR: string;
  farmAPR: string;
  dailyVolumeUSD: string;
  feesUSD: string;
  tvlUSD: string;
  pool: Pool;
}

const formatLargeNumber = (num: number): string => {
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

const calculateChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  const change = ((current - previous) / previous) * 100;
  return isNaN(change) ? 0 : change;
};

interface PoolsTableProps {
  pools: PoolItem[];
}

const PoolsTable: React.FC<PoolsTableProps> = ({ pools }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof PoolItem | "feesUSD" | "totalAPR";
    direction: "ascending" | "descending";
  }>({ key: "tvlUSD", direction: "descending" });

  const filteredAndSortedPools = [...pools]
    .filter((pool) => parseFloat(pool.tvlUSD) > 15)
    .filter((pool) => {
      const searchTermLower = searchTerm.toLowerCase();
      const token1Symbol = pool.pool.token1Info.symbol.toLowerCase();
      const token2Symbol = pool.pool.token2Info.symbol.toLowerCase();
      return (
        (token1Symbol.includes(searchTermLower) || token2Symbol.includes(searchTermLower)) &&
        parseFloat(pool.tvlUSD) > 0
      );
    })
    .sort((a, b) => {
      let aVal, bVal;
      if (sortConfig.key === "totalAPR") {
        aVal = parseFloat(a.feeAPR) + parseFloat(a.farmAPR);
        bVal = parseFloat(b.feeAPR) + parseFloat(b.farmAPR);
      } else {
        aVal = parseFloat(a[sortConfig.key] as string);
        bVal = parseFloat(b[sortConfig.key] as string);
      }
      if (aVal < bVal) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });

  const requestSort = (
    key: keyof PoolItem | "feesUSD" | "totalAPR",
    direction: "ascending" | "descending"
  ) => {
    setSortConfig({ key, direction });
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        type="search"
        placeholder="Search by token..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full mt-4 max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pool</TableHead>
            <TableHead className="cursor-pointer">
              <div className="flex items-center">
                TVL
                <div className="flex flex-col ml-2">
                  <ArrowUp
                    className={`h-3 w-3 cursor-pointer ${sortConfig.key === "tvlUSD" && sortConfig.direction === "ascending"
                        ? "text-primary"
                        : ""
                      }`}
                    onClick={() => requestSort("tvlUSD", "ascending")}
                  />
                  <ArrowDown
                    className={`h-3 w-3 cursor-pointer ${sortConfig.key === "tvlUSD" && sortConfig.direction === "descending"
                        ? "text-primary"
                        : ""
                      }`}
                    onClick={() => requestSort("tvlUSD", "descending")}
                  />
                </div>
              </div>
            </TableHead>
            <TableHead className="cursor-pointer">
              <div className="flex items-center">
                Volume (24h)
                <div className="flex flex-col ml-2">
                  <ArrowUp
                    className={`h-3 w-3 cursor-pointer ${sortConfig.key === "dailyVolumeUSD" &&
                        sortConfig.direction === "ascending"
                        ? "text-primary"
                        : ""
                      }`}
                    onClick={() => requestSort("dailyVolumeUSD", "ascending")}
                  />
                  <ArrowDown
                    className={`h-3 w-3 cursor-pointer ${sortConfig.key === "dailyVolumeUSD" &&
                        sortConfig.direction === "descending"
                        ? "text-primary"
                        : ""
                      }`}
                    onClick={() => requestSort("dailyVolumeUSD", "descending")}
                  />
                </div>
              </div>
            </TableHead>
            <TableHead className="cursor-pointer">
              <div className="flex items-center">
                Fee (24h)
                <div className="flex flex-col ml-2">
                  <ArrowUp
                    className={`h-3 w-3 cursor-pointer ${sortConfig.key === "feesUSD" && sortConfig.direction === "ascending"
                        ? "text-primary"
                        : ""
                      }`}
                    onClick={() => requestSort("feesUSD", "ascending")}
                  />
                  <ArrowDown
                    className={`h-3 w-3 cursor-pointer ${sortConfig.key === "feesUSD" && sortConfig.direction === "descending"
                        ? "text-primary"
                        : ""
                      }`}
                    onClick={() => requestSort("feesUSD", "descending")}
                  />
                </div>
              </div>
            </TableHead>
            <TableHead className="cursor-pointer">
              <div className="flex items-center">
                APR
                <div className="flex flex-col ml-2">
                  <ArrowUp
                    className={`h-3 w-3 cursor-pointer ${sortConfig.key === "totalAPR" && sortConfig.direction === "ascending"
                        ? "text-primary"
                        : ""
                      }`}
                    onClick={() => requestSort("totalAPR", "ascending")}
                  />
                  <ArrowDown
                    className={`h-3 w-3 cursor-pointer ${sortConfig.key === "totalAPR" && sortConfig.direction === "descending"
                        ? "text-primary"
                        : ""
                      }`}
                    onClick={() => requestSort("totalAPR", "descending")}
                  />
                </div>
              </div>
            </TableHead>

          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedPools.map((pool) => (
            <TableRow key={pool.id}>
              <TableCell>
                <div className="flex items-center">
                  <div className="flex items-center">
                    <img
                      src={pool.pool.token1Info.logoUrl || "/default-token.png"}
                      alt={pool.pool.token1Info.symbol}
                      className="w-6 h-6 rounded-full"
                    />
                    <img
                      src={pool.pool.token2Info.logoUrl || "/default-token.png"}
                      alt={pool.pool.token2Info.symbol}
                      className="w-6 h-6 rounded-full -ml-2"
                    />
                  </div>
                  <span className="ml-2">
                    {pool.pool.token1Info.symbol}/{pool.pool.token2Info.symbol}
                  </span>
                </div>
              </TableCell>
              <TableCell>{formatLargeNumber(parseFloat(pool.tvlUSD))}</TableCell>
              <TableCell>{formatLargeNumber(parseFloat(pool.dailyVolumeUSD))}</TableCell>
              <TableCell>{formatLargeNumber(parseFloat(pool.feesUSD))}</TableCell>
              <TableCell>
                <span>{(parseFloat(pool.feeAPR) + parseFloat(pool.farmAPR)).toFixed(2)}%</span>
              </TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default function LiquidSwapPage() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pools, setPools] = useState<PoolItem[]>([]);
  // const [positions, setPositions] = useState<Position[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const sdk = new SDK({
    nodeUrl: "https://fullnode.mainnet.aptoslabs.com/v1",
  });

  const ownerAddress =
    account?.address && typeof account.address === "object" && "data" in account.address
      ? toHexString((account.address as any).data)
      : account?.address;

  const liquidSwapProtocol = protocols.find((p) => p.name === "LiquidSwap");

  useEffect(() => {
    fetchProtocolData();
    fetchAllPools();
  }, [ownerAddress]);

  const fetchProtocolData = async () => {
    setLoading(true);
    try {
      if (!liquidSwapProtocol) {
        throw new Error("LiquidSwap protocol not found in protocols.json");
      }

      const protocolId =
        liquidSwapProtocol.llama_id ||
        liquidSwapProtocol.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const tvlResponse = await fetch(`https://api.llama.fi/protocol/${protocolId}`);
      if (!tvlResponse.ok) throw new Error("TVL fetch failed");
      const tvlData = await tvlResponse.json();

      const volumeResponse = await fetch(
        `https://api.llama.fi/summary/dexs/${protocolId}?excludeTotalDataChart=false&excludeTotalDataChartBreakdown=false`
      );
      if (!volumeResponse.ok) throw new Error("Volume fetch failed");
      const volumeData = await volumeResponse.json();

      const aptosTvls = tvlData.chainTvls?.Aptos?.tvl || [];

      const getTvlByDaysAgo = (days: number) => {
        if (aptosTvls.length > days) {
          return aptosTvls[aptosTvls.length - 1 - days].totalLiquidityUSD;
        }
        return null;
      };

      const latestTvl = aptosTvls.length > 0 ? aptosTvls[aptosTvls.length - 1].totalLiquidityUSD : 0;

      const tvl1d = getTvlByDaysAgo(1);
      const tvl7d = getTvlByDaysAgo(7);
      const tvl30d = getTvlByDaysAgo(30);

      const change_1d = tvl1d !== null ? calculateChange(latestTvl, tvl1d) : 0;
      const change_7d = tvl7d !== null ? calculateChange(latestTvl, tvl7d) : 0;
      const change_30d = tvl30d !== null ? calculateChange(latestTvl, tvl30d) : 0;

      setData({
        id: protocolId,
        tvl: tvlData.currentChainTvls?.Aptos || 0,
        volume24h: volumeData.total24h || 0,
        change_1d,
        change_7d,
        change_30d,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch data for LiquidSwap",
      });
      console.error("Error fetching data for LiquidSwap:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPools = async () => {
    try {
      const response = await fetch('https://api.liquidswap.com/pools/registered?networkId=1');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const apiPools = await response.json();
      console.log(apiPools);

      const poolItems: PoolItem[] = apiPools.map((apiPool: ApiPool) => {
        const pool: Pool = {
          poolId: apiPool?.type,
          token1: apiPool?.coinX?.type,
          token2: apiPool?.coinY?.type,
          token1Info: {
            coinType: apiPool?.coinX?.type,
            symbol: apiPool?.coinX?.symbol,
            decimals: apiPool?.coinX?.decimals,
            logoUrl: apiPool?.coinX?.logoUrl,
            name: apiPool?.coinX?.name,
          },
          token2Info: {
            coinType: apiPool?.coinY?.type,
            symbol: apiPool?.coinY?.symbol,
            decimals: apiPool?.coinY?.decimals,
            logoUrl: apiPool?.coinY?.logoUrl,
            name: apiPool?.coinY?.name,
          },
          curveType: apiPool?.curve === 'unstable' ? 'uncorrelated' : 'stable',
          version: apiPool?.version as 0 | 0.5,
          tvlUSD: parseFloat(apiPool?.tvl),
          dailyVolumeUSD: apiPool?.volume24,
          feeRate: `${apiPool?.normalizedFee * 100}%`,
        };

        return {
          id: pool.poolId,
          feeAPR: apiPool?.apr?.toString(),
          farmAPR: "0", // No farm APR data from this endpoint
          dailyVolumeUSD: pool.dailyVolumeUSD.toString(),
          feesUSD: (pool.dailyVolumeUSD * apiPool.normalizedFee).toString(),
          tvlUSD: pool.tvlUSD.toString(),
          pool,
        };
      });

      setPools(poolItems);
    } catch (error) {
      console.error("Error fetching pools:", error);
     toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to fetch pools",
    });
    }
  };

  console.log(pools);

  return (
    <div>
      <div className="mx-auto flex flex-col gap-y-12 relative">
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
          <p className="font-bold">Under Development</p>
          <p>We are working to integrate other functionalities. Stay tuned!</p>
        </div>
        <Button className="w-max" variant="outline" onClick={() => navigate("/platforms")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="absolute left-1/2 right-0 -z-10 h-full max-w-[100vw] min-w-[calc(100vw-64px)] -translate-x-1/2 border-b bg-gradient-to-t from-primary/10 to-transparent backdrop-blur-sm"></div>
        <div className="flex gap-x-4 items-center mb-6">
          <div className="p-6 rounded-md bg-white">
            <img
              src={liquidSwapProtocol?.logo}
              alt={liquidSwapProtocol?.name}
              className="min-w-16 min-h-16 max-w-16 max-h-16"
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <div className="flex items-center gap-x-2">
              <h1 className="text-2xl font-bold text-white">{liquidSwapProtocol?.name}</h1>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                fill="currentColor"
                viewBox="0 0 256 256"
                className="size-6 text-primary"
              >
                <path d="M225.86,102.82c-3.77-3.94-7.67-8-9.14-11.57-1.36-3.27-1.44-8.69-1.52-13.94-.15-9.76-.31-20.82-8-28.51s-18.75-7.85-28.51-8c-5.25-.08-10.67-.16-13.94-1.52-3.56-1.47-7.63-5.37-11.57-9.14C146.28,23.51,138.44,16,128,16s-18.27,7.51-25.18,14.14c-3.94,3.77-8,7.67-11.57,9.14C88,40.64,82.56,40.72,77.31,40.8c-9.76.15-20.82.31-28.51,8S41,67.55,40.8,77.31c-.08,5.25-.16,10.67-1.52,13.94-1.47,3.56-5.37-7.63,9.14-11.57C23.51,109.72,16,117.56,16,128s7.51,18.27,14.14,25.18c3.77,3.94,7.67,8,9.14,11.57,1.36,3.27,1.44,8.69,1.52,13.94.15,9.76.31,20.82,8,28.51s18.75,7.85,28.51,8c5.25.08,10.67.16,13.94,1.52,3.56,1.47,7.63,5.37,11.57,9.14C109.72,232.49,117.56,240,128,240s18.27-7.51,25.18-14.14c3.94-3.77,8-7.67,11.57-9.14,3.27-1.36,8.69-1.44,13.94-1.52,9.76-.15,20.82-.31,28.51-8s7.85-18.75,8-28.51c.08-5.25.16-10.67,1.52-13.94,1.47-3.56,5.37-7.63,9.14-11.57C232.49,146.28,240,138.44,240,128S232.49,109.73,225.86,102.82Zm-52.2,6.84-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z"></path>
              </svg>
            </div>
            <p className="text-muted-foreground max-w-[70%]">{liquidSwapProtocol?.description}</p>
          </div>
        </div>
        {loading && (
          <div className="mb-4 flex items-center gap-x-4">
            <Skeleton className="vault-bg w-24 h-4" />
            <Skeleton className="vault-bg w-24 h-4" />
            <Skeleton className="vault-bg w-24 h-4" />
            <Skeleton className="vault-bg w-24 h-4" />
            <Skeleton className="vault-bg w-24 h-4" />
          </div>
        )}
        {data && (
          <div className="flex w-[80%] mb-12 justify-between space-x-4 items-center">
            <div>
              <h2 className="text-sm font-semibold uppercase">TVL</h2>
              <p className="text-sm">${data.tvl.toLocaleString()}</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase">24h Volume</h2>
              <p className="text-sm">${data.volume24h.toLocaleString()}</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase">1D Change</h2>
              <p className={`text-sm ${data.change_1d >= 0 ? "text-green-500" : "text-red-500"}`}>
                {data.change_1d.toFixed(2)}%
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase">1W Change</h2>
              <p className={`text-sm ${data.change_7d >= 0 ? "text-green-500" : "text-red-500"}`}>
                {data.change_7d.toFixed(2)}%
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase">1M Change</h2>
              <p className={`text-sm ${data.change_30d >= 0 ? "text-green-500" : "text-red-500"}`}>
                {data.change_30d.toFixed(2)}%
              </p>
            </div>
          </div>
        )}

      </div>

      <Tabs defaultValue="pools" className="w-full">
        <TabsList className="w-full justify-start rounded-none bg-transparent p-0">
          <TabsTrigger
            value="pools"
            className="relative rounded-none border-t-2 border-transparent bg-transparent px-4 pt-3 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent"
          >
            Pools
          </TabsTrigger>
          <TabsTrigger
            value="positions"
            className="relative rounded-none border-t-2 border-transparent bg-transparent px-4 pt-3 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent"
          >
            Your Positions
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pools">
          <PoolsTable pools={pools} />
        </TabsContent>
        <TabsContent value="positions">
          <div className="mt-4 text-center">
            <p className="text-lg font-semibold">Coming Soon</p>
            <p className="text-muted-foreground">This feature is currently under development.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}