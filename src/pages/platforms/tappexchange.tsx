import { Aptos, AptosConfig, Network, Serializer, AccountAddress, U256, U64 } from "@aptos-labs/ts-sdk";
import { initTappSDK } from '@tapp-exchange/sdk';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUp, ArrowDown, ArrowLeft, Minus, Plus, Wallet } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import protocols from '@/utils/protocols.json';
import { useNavigate } from 'react-router-dom';
import { toHexString } from '@/lib';
import { Skeleton } from "@/components/ui/skeleton";
import { WalletSelector } from "@/components/WalletSelector";
import { useTokenStore } from '@/store/tokenStore';
import tokens from '@/utils/tokens.json';

// Custom interfaces based on provided data
interface Token {
  addr: string;
  amount: string;
  decimals: number;
  idx: number;
  img: string;
  symbol: string;
  usd: string;
  verified: boolean;
}

interface CampaignApr {
  aprPercentage: string;
  campaignIdx: string;
  token: Token;
}

interface Apr {
  boostedAprPercentage: string;
  campaignAprs: CampaignApr[];
  feeAprPercentage: string;
  totalAprPercentage: string;
}

interface Pool {
  poolId: string;
  feeTier: string;
  token1Info: {
    addr: string;
    symbol: string;
    logoUrl: string;
    decimals?: number;
  };
  token2Info: {
    addr: string;
    symbol: string;
    logoUrl: string;
    decimals?: number;
  };
}

interface PoolItem {
  id: string;
  tvlUSD: string;
  dailyVolumeUSD: number;
  feesUSD: string;
  feeAPR: string;
  farmAPR: string;
  pool: Pool;
  poolType?: string; // Added to track pool type (AMM, CLMM, STABLE)
}

interface Position {
  apr: Apr;
  collectedFees: string;
  estimatedCollectFees: Token[];
  estimatedIncentives: Token[];
  estimatedWithdrawals: Token[];
  feeTier: string;
  initialDeposits: Token[];
  max: string;
  min: string;
  mintedShare: string;
  poolId: string;
  poolType: string;
  positionAddr: string;
  positionIdx: string;
  shareOfPool: string;
  sqrtPrice: string;
  totalEarnings: Token[];
  tvl: string;
  userAddr: string;
  volume24h: string;
}

// Initialize TappExchange SDK
const aptosConfig = new AptosConfig({ network: Network.MAINNET });
const aptos = new Aptos(aptosConfig);

const sdk = initTappSDK({
  network: Network.MAINNET,
});

// Utility to format large numbers
const formatLargeNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
};

// Calculate percentage change
const calculateChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  const change = ((current - previous) / previous) * 100;
  return isNaN(change) ? 0 : change;
};

// PoolsTable component
interface PoolsTableProps {
  pools: PoolItem[];
  setSelectedPool: (pool: PoolItem | null) => void;
  setIsDepositModalOpen: (isOpen: boolean) => void;
}

const PoolsTable: React.FC<PoolsTableProps> = ({ pools, setSelectedPool, setIsDepositModalOpen }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof PoolItem | 'feesUSD' | 'totalAPR'; direction: 'ascending' | 'descending' }>({ key: 'tvlUSD', direction: 'descending' });

  const filteredAndSortedPools = [...pools]
    .filter(pool => parseFloat(pool.tvlUSD) > 15)
    .filter(pool => {
      const searchTermLower = searchTerm.toLowerCase();
      const token1Symbol = pool.pool.token1Info.symbol.toLowerCase();
      const token2Symbol = pool.pool.token2Info.symbol.toLowerCase();
      return (token1Symbol.includes(searchTermLower) || token2Symbol.includes(searchTermLower)) && parseFloat(pool.tvlUSD) > 0;
    })
    .sort((a, b) => {
      let aVal, bVal;
      if (sortConfig.key === 'totalAPR') {
        aVal = parseFloat(a.feeAPR) + parseFloat(a.farmAPR);
        bVal = parseFloat(b.feeAPR) + parseFloat(b.farmAPR);
      } else {
        aVal = parseFloat(a[sortConfig.key] as any);
        bVal = parseFloat(b[sortConfig.key] as any);
      }
      if (aVal < bVal) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

  const requestSort = (key: keyof PoolItem | 'feesUSD' | 'totalAPR', direction: 'ascending' | 'descending') => {
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
        <TableHeader className="bg-background text-muted-foreground">
          <TableRow>
            <TableHead className="text-foreground">Pool</TableHead>
            <TableHead className="cursor-pointer text-foreground">
              <div className="flex items-center">
                TVL
                <div className="flex flex-col ml-2">
                  <ArrowUp className={`h-3 w-3 cursor-pointer ${sortConfig.key === 'tvlUSD' && sortConfig.direction === 'ascending' ? 'text-primary' : ''}`} onClick={() => requestSort('tvlUSD', 'ascending')} />
                  <ArrowDown className={`h-3 w-3 cursor-pointer ${sortConfig.key === 'tvlUSD' && sortConfig.direction === 'descending' ? 'text-primary' : ''}`} onClick={() => requestSort('tvlUSD', 'descending')} />
                </div>
              </div>
            </TableHead>
            <TableHead className="cursor-pointer text-foreground">
              <div className="flex items-center">
                Volume (24h)
                <div className="flex flex-col ml-2">
                  <ArrowUp className={`h-3 w-3 cursor-pointer ${sortConfig.key === 'dailyVolumeUSD' && sortConfig.direction === 'ascending' ? 'text-primary' : ''}`} onClick={() => requestSort('dailyVolumeUSD', 'ascending')} />
                  <ArrowDown className={`h-3 w-3 cursor-pointer ${sortConfig.key === 'dailyVolumeUSD' && sortConfig.direction === 'descending' ? 'text-primary' : ''}`} onClick={() => requestSort('dailyVolumeUSD', 'descending')} />
                </div>
              </div>
            </TableHead>
            <TableHead className="cursor-pointer text-foreground">
              <div className="flex items-center">
                Fee (24h)
                <div className="flex flex-col ml-2">
                  <ArrowUp className={`h-3 w-3 cursor-pointer ${sortConfig.key === 'feesUSD' && sortConfig.direction === 'ascending' ? 'text-primary' : ''}`} onClick={() => requestSort('feesUSD', 'ascending')} />
                  <ArrowDown className={`h-3 w-3 cursor-pointer ${sortConfig.key === 'feesUSD' && sortConfig.direction === 'descending' ? 'text-primary' : ''}`} onClick={() => requestSort('feesUSD', 'descending')} />
                </div>
              </div>
            </TableHead>
            <TableHead className="cursor-pointer text-foreground">
              <div className="flex items-center">
                APR
                <div className="flex flex-col ml-2">
                  <ArrowUp className={`h-3 w-3 cursor-pointer ${sortConfig.key === 'totalAPR' && sortConfig.direction === 'ascending' ? 'text-primary' : ''}`} onClick={() => requestSort('totalAPR', 'ascending')} />
                  <ArrowDown className={`h-3 w-3 cursor-pointer ${sortConfig.key === 'totalAPR' && sortConfig.direction === 'descending' ? 'text-primary' : ''}`} onClick={() => requestSort('totalAPR', 'descending')} />
                </div>
              </div>
            </TableHead>
            <TableHead className="text-foreground">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedPools.map((pool) => (
            <TableRow key={pool.id}>
              <TableCell>
                <div className="flex flex-col gap-y-1">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      <img src={pool.pool.token1Info.logoUrl} alt={pool.pool.token1Info.symbol} className="w-6 h-6 rounded-full" />
                      <img src={pool.pool.token2Info.logoUrl} alt={pool.pool.token2Info.symbol} className="w-6 h-6 rounded-full -ml-2" />
                    </div>
                    <span className="ml-2">{pool.pool.token1Info.symbol} - {pool.pool.token2Info.symbol}</span>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <span>{pool?.poolType?.toLowerCase()}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>{formatLargeNumber(parseFloat(pool.tvlUSD))}</TableCell>
              <TableCell>{formatLargeNumber(pool.dailyVolumeUSD)}</TableCell>
              <TableCell>{formatLargeNumber(parseFloat(pool.feesUSD))}</TableCell>
              <TableCell>
                <span>
                  {(parseFloat(pool.feeAPR) + parseFloat(pool.farmAPR)).toFixed(2)}%
                </span>
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => {
                    setSelectedPool(pool);
                    setIsDepositModalOpen(true);
                  }}
                >
                  Deposit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const TappExchangePage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pools, setPools] = useState<PoolItem[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState<PoolItem | null>(null);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingPosition, setLoadingPosition] = useState(true);
  const [loadingPool, setLoadingPool] = useState(true);
  const { account, signAndSubmitTransaction, connected } = useWallet();

  const ownerAddress = account?.address && typeof account.address === 'object' && 'data' in account.address
    ? toHexString((account.address as any).data)
    : account?.address;

  const ser = new Serializer();

  const tappExchangeProtocol = protocols.find(p => p.name === 'TappExchange');

  const { balances, appBalances } = useTokenStore();

  console.log(appBalances);


  const getFeeIndex = (option: string) => {
    let feeIndex = 0;
    if (option === '0.01') {
      feeIndex = 0;
    } else if (option === '0.05') {
      feeIndex = 1;
    } else if (option === '0.3') {
      feeIndex = 2;
    } else if (option === '1') {
      feeIndex = 3;
    } else if (option === '0.1') {
      feeIndex = 4;
    } else if (option === '0.25') {
      feeIndex = 5;
    }
    return feeIndex;
  };

  useEffect(() => {
    const fetchProtocolData = async () => {
      setLoading(true);
      try {
        if (!tappExchangeProtocol) {
          throw new Error('TappExchange protocol not found in protocols.json');
        }

        const protocolId = tappExchangeProtocol.llama_id || tappExchangeProtocol.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        const tvlResponse = await fetch(`https://api.llama.fi/protocol/${protocolId}`);
        if (!tvlResponse.ok) throw new Error('TVL fetch failed');
        const tvlData = await tvlResponse.json();

        const volumeResponse = await fetch(`https://api.llama.fi/summary/dexs/${protocolId}?excludeTotalDataChart=false&excludeTotalDataChartBreakdown=false`);
        if (!volumeResponse.ok) throw new Error('Volume fetch failed');
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
        setError(err.message);
        console.error('Error fetching data for TappExchange:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProtocolData();
    fetchAllPools();
    if (ownerAddress) {
      fetchPositions();
    }
  }, [ownerAddress, account?.address]);

  const fetchAllPools = async () => {
    try {
      setLoadingPool(true);
      const allPoolsData = await sdk.Pool.getPools({
        page: 1,
        size: 20,
        sortBy: 'tvl',
      });

      const poolItems: PoolItem[] = allPoolsData.data.map((apiPool: any) => {
        const token1 = apiPool.tokens[0];
        const token2 = apiPool.tokens[1];

        const pool: Pool = {
          poolId: apiPool?.poolId,
          feeTier: apiPool?.feeTier,
          token1Info: {
            addr: token1?.addr,
            symbol: token1?.symbol,
            logoUrl: token1?.img,
            decimals: token1?.decimals,
          },
          token2Info: {
            addr: token2?.addr,
            symbol: token2?.symbol,
            logoUrl: token2?.img,
            decimals: token2?.decimals,
          },
        };

        const feeAPR = apiPool?.apr?.feeAprPercentage;
        const totalAPR = apiPool?.apr?.totalAprPercentage;
        const farmAPR = totalAPR - feeAPR > 0 ? totalAPR - feeAPR : 0;

        return {
          id: apiPool?.poolId,
          tvlUSD: apiPool.tvl,
          dailyVolumeUSD: apiPool?.volumeData?.volume24h,
          feesUSD: apiPool.fee,
          feeAPR: feeAPR?.toString(),
          farmAPR: farmAPR?.toString(),
          pool,
          poolType: apiPool.poolType, // Capture pool type
        };
      });

      console.log(poolItems)

      setPools(poolItems);
      setLoadingPool(false);
    } catch (error) {
      setLoadingPool(false);
      console.error('Error fetching pools:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch pools",
      });
    }
  };

  const fetchPositions = async () => {
    if (!ownerAddress) {
      setPositions([]);
      setLoadingPosition(false);
      return;
    }
    try {
      setLoadingPosition(true);
      const data = await sdk.Position.getPositions({
        userAddr: ownerAddress as string,
        page: 1,
        size: 10,
      });
      console.log(data.data);
      setPositions(data.data as unknown as Position[]);
      setLoadingPosition(false);
    } catch (error) {
      console.error('Error fetching positions:', error);
      setPositions([]);
      setLoadingPosition(false);
    }
  };

  const handleDeposit = async () => {
    if (!selectedPool || !ownerAddress || !connected) return;

    try {

      const decimalsA = tokens.find((token) => token.faAddress === selectedPool?.pool.token1Info.addr)?.decimals;
      const decimalsB = tokens.find((token) => token.faAddress === selectedPool?.pool.token2Info.addr)?.decimals;
      const currencyAAmount = Math.pow(10, decimalsA || 6) * parseFloat(amountA);
      const currencyBAmount = Math.pow(10, decimalsB || 6) * parseFloat(amountB);


      // Estimate amountB using getEstSwapAmount
      // const estSwap = await sdk.Swap.getEstSwapAmount({
      //   poolId: selectedPool.pool.poolId,
      //   a2b: true,
      //   field: 'input',
      //   amount: currencyAAmount,
      //   pair: [0, 1],
      // });

      // if (estSwap.error) {
      //   throw new Error(`Swap estimation failed: ${estSwap.error.message}`);
      // }

      // const currencyBAmount = estSwap.estAmount;

      let txData;
      const fee = parseInt(selectedPool.pool.feeTier.replace('.', '')) * 100; // Convert feeTier to basis points (e.g., 0.01 -> 100)

      if (selectedPool.poolType === 'AMM') {
        txData = sdk.Position.addAMMLiquidity({
          poolId: selectedPool.pool.poolId,
          amountA: currencyAAmount,
          amountB: currencyBAmount,
        });
      } else if (selectedPool.poolType === 'CLMM') {
        txData = sdk.Position.addCLMMLiquidity({
          poolId: selectedPool.pool.poolId,
          amountA: currencyAAmount,
          amountB: currencyBAmount,
          fee,
          isMaxAmountB: true,
          minPrice: 0.00001,
          maxPrice: 100000,
        });
      } else if (selectedPool.poolType === 'STABLE') {
        txData = sdk.Position.addStableLiquidity({
          poolId: selectedPool.pool.poolId,
          amounts: [currencyAAmount, currencyBAmount],
        });
      } else {
        throw new Error('Unknown pool type');
      }

      await signAndSubmitTransaction({
        sender: ownerAddress,
        data: txData,
      });

      setIsDepositModalOpen(false);
      setAmountA('');
      setAmountB('');
      toast({
        title: "Success",
        description: "Liquidity added successfully",
      });
    } catch (error) {
      console.error('Error depositing liquidity:', error);
      setError(error instanceof Error ? error.message : 'Failed to deposit liquidity');
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to deposit liquidity',
      });
    }
  };

  const handleRemoveLiquidity = async (position: Position) => {
    if (!ownerAddress) return;

    try {
      const removeRatio = 1; // 50% removal as example
      const mintedShare = BigInt(position.mintedShare);
      const minAmount0 = parseFloat((position.estimatedWithdrawals[0]?.amount || '0'));
      const minAmount1 = parseFloat((position.estimatedWithdrawals[1]?.amount || '0'));

      let incentive = parseFloat((position.estimatedIncentives[0]?.amount || '0'));
      let formatedMinAmount0 = Math.floor(minAmount0 * Math.pow(10, position.estimatedWithdrawals?.[0]?.decimals || 6));
      let formatedMinAmount1 = Math.floor(minAmount1 * Math.pow(10, position.estimatedWithdrawals?.[1]?.decimals || 6));

      let finalMinAmount0 = formatedMinAmount0 + (incentive * Math.pow(10, position.estimatedWithdrawals?.[0]?.decimals || 6));
      let finalMinAmount1 = formatedMinAmount1 - (incentive * Math.pow(10, position.estimatedWithdrawals?.[1]?.decimals || 6));
      
      console.log(finalMinAmount0)
      console.log(finalMinAmount1)

      let txData;

      if (position.poolType === 'AMM') {
        let removeSingleAMMLiquidityData = {
          poolId: position.poolId,
          positionAddr: position.positionAddr,
          mintedShare,
          minAmount0,
          minAmount1,
        }
        console.log(removeSingleAMMLiquidityData);
        txData = sdk.Position.removeSingleAMMLiquidity(removeSingleAMMLiquidityData);
      } else if (position.poolType === 'CLMM') {
        let removeSingleCLMMLiquidityData = {
          poolId: position.poolId,
          positionAddr: position.positionAddr,
          mintedShare,
          minAmount0,
          minAmount1,
        }
        console.log(removeSingleCLMMLiquidityData);
        txData = sdk.Position.removeSingleCLMMLiquidity(removeSingleCLMMLiquidityData);
      } else if (position.poolType === 'STABLE') {
        let removeSingleStableLiquidityData = {
          poolId: position.poolId,
          position: {
            positionAddr: position.positionAddr,
            mintedShare,
            amounts: [minAmount1, minAmount0],
          },
          liquidityType: 0,
        }
        // console.log(removeSingleStableLiquidityData);
        // txData = sdk.Position.removeSingleStableLiquidity(removeSingleStableLiquidityData);

        // txData = {
        //   function: txData.function,
        //   functionArguments: [Object.values(txData?.functionArguments?.[0])], 
        // }

      } else {
        throw new Error('Unknown pool type');
      }

      const routerAddress = "0x487e905f899ccb6d46fdaec56ba1e0c4cf119862a16c409904b8c78fab1f5e8a";
      const functionName = "remove_liquidity";

      console.log(formatedMinAmount0);
      console.log(formatedMinAmount1);
      console.log(minAmount0);
      console.log(minAmount1);

      ser.serialize(AccountAddress.fromString(position.poolId));
      ser.serialize(AccountAddress.fromString(position.positionAddr));
      ser.serializeU8(1); // Corresponds to liquidityType
      ser.serializeU256(BigInt(position.mintedShare));
      ser.serializeVector([finalMinAmount0, finalMinAmount1].map(amount => new U256(BigInt(Math.round(amount)))));

      // const transaction = await aptos.transaction.build.simple({
      //   sender: account.address,
      //   data: 
      //     function: `${routerAddress}::router::${functionName}`,
      //     functionArguments: [ser.toUint8Array()],
      //   },
      // });

      await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${routerAddress}::router::${functionName}`,
          functionArguments: [ser.toUint8Array()],
        },
      });

      await fetchPositions();
      toast({
        title: "Success",
        description: "Liquidity removed successfully",
      });
    } catch (error) {
      console.error('Error removing liquidity:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove liquidity');
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to remove liquidity',
      });
    }
  };

  const handleClaimRewards = async (positionId: string) => {
    try {
      const payload = await sdk.Position.collectFee({
        poolId: positionId,
        positionAddr: positionId,
      });
      await signAndSubmitTransaction({
        sender: ownerAddress,
        data: payload,
      });
      await fetchPositions();
      toast({
        title: "Success",
        description: "Rewards claimed successfully",
      });
    } catch (error) {
      console.error('Error claiming rewards:', error);
      setError(error instanceof Error ? error.message : 'Failed to claim rewards');
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to claim rewards',
      });
    }
  };

  return (
    <div>
      <div className="mx-auto flex flex-col gap-y-12 relative">
        <Button className="w-max" variant="outline" onClick={() => navigate('/platforms')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="absolute left-1/2 right-0 -z-10 h-full max-w-[100vw] min-w-[calc(100vw-64px)] -translate-x-1/2 border-b bg-gradient-to-t from-primary/10 to-transparent backdrop-blur-sm"></div>
        <div className="flex gap-x-4 items-center mb-6">
          <div className="p-6 rounded-md bg-white">
            <img
              src={tappExchangeProtocol?.logo}
              alt={tappExchangeProtocol?.name}
              className="min-w-16 min-h-16 max-w-16 max-h-16"
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <div className="flex items-center gap-x-2">
              <h1 className="text-2xl font-bold text-white">{tappExchangeProtocol?.name}</h1>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                fill="currentColor"
                viewBox="0 0 256 256"
                className="size-6 text-primary"
              >
                <path d="M225.86,102.82c-3.77-3.94-7.67-8-9.14-11.57-1.36-3.27-1.44-8.69-1.52-13.94-.15-9.76-.31-20.82-8-28.51s-18.75-7.85-28.51-8c-5.25-.08-10.67-.16-13.94-1.52-3.56-1.47-7.63-5.37-11.57-9.14C146.28,23.51,138.44,16,128,16s-18.27,7.51-25.18,14.14c-3.94,3.77-8,7.67-11.57,9.14C88,40.64,82.56,40.72,77.31,40.8c-9.76.15-20.82.31-28.51,8S41,67.55,40.8,77.31c-.08,5.25-.16,10.67-1.52,13.94-1.47,3.56-5.37,7.63-9.14,11.57C23.51,109.72,16,117.56,16,128s7.51,18.27,14.14,25.18c3.77,3.94,7.67,8,9.14,11.57,1.36,3.27,1.44,8.69,1.52,13.94.15,9.76.31,20.82,8,28.51s18.75,7.85,28.51,8c5.25.08,10.67.16,13.94,1.52,3.56,1.47,7.63,5.37,11.57,9.14C109.72,232.49,117.56,240,128,240s18.27-7.51,25.18-14.14c3.94-3.77,8-7.67,11.57-9.14,3.27-1.36,8.69-1.44,13.94-1.52,9.76-.15,20.82-.31,28.51-8s7.85-18.75,8-28.51c.08-5.25.16-10.67,1.52-13.94,1.47-3.56,5.37-7.63,9.14-11.57C232.49,146.28,240,138.44,240,128S232.49,109.73,225.86,102.82Zm-52.2,6.84-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z"></path>
              </svg>
            </div>
            <p className="text-muted-foreground max-w-[70%]">{tappExchangeProtocol?.description}</p>
          </div>
        </div>
        {loading && (
          <div className="mb-4 flex items-center gap-x-4">
            <Skeleton className="vault-bg w-32 h-8" />
            <Skeleton className="vault-bg w-24 h-8" />
            <Skeleton className="vault-bg w-24 h-8" />
            <Skeleton className="vault-bg w-24 h-8" />
            <Skeleton className="vault-bg w-24 h-8" />
          </div>
        )}
        {error && <p className="text-red-500">Error: {error}</p>}
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
              <p className={`text-sm ${data.change_1d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.change_1d.toFixed(2)}%
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase">1W Change</h2>
              <p className={`text-sm ${data.change_7d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.change_7d.toFixed(2)}%
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase">1M Change</h2>
              <p className={`text-sm ${data.change_30d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.change_30d.toFixed(2)}%
              </p>
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="pools" className="w-full">
        <TabsList className="w-full justify-start rounded-none bg-transparent p-0">
          <TabsTrigger value="pools" className="relative rounded-none border-t-2 border-transparent bg-transparent px-4 pt-3 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent">Pools</TabsTrigger>
          <TabsTrigger value="positions" className="relative rounded-none border-t-2 border-transparent bg-transparent px-4 pt-3 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent">Your Positions</TabsTrigger>
        </TabsList>

        <TabsContent value="pools">
          <PoolsTable pools={pools} setSelectedPool={setSelectedPool} setIsDepositModalOpen={setIsDepositModalOpen} />
        </TabsContent>
        <TabsContent value="positions">
          {(loadingPosition && connected) ? (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader className="bg-background">
                  <TableRow>
                    <TableHead className="text-foreground">Pools</TableHead>
                    <TableHead className="text-foreground">Range</TableHead>
                    <TableHead className="text-foreground">Position</TableHead>
                    <TableHead className="text-foreground">APR</TableHead>
                    <TableHead className="text-foreground">Earnings</TableHead>
                    <TableHead className="text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-20" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : positions.length > 0 && connected ? (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader className="bg-background text-muted-foreground">
                  <TableRow>
                    <TableHead className="text-foreground">Pools</TableHead>
                    <TableHead className="text-foreground">Range</TableHead>
                    <TableHead className="text-foreground">Position</TableHead>
                    <TableHead className="text-foreground">APR</TableHead>
                    <TableHead className="text-foreground">Earnings</TableHead>
                    <TableHead className="text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position) => {
                    const totalEarnings = position.estimatedCollectFees.reduce((acc, fee) => acc + parseFloat(fee.usd), 0) +
                      position.estimatedIncentives.reduce((acc, reward) => acc + parseFloat(reward.usd), 0);

                    return (
                      <TableRow key={position.positionAddr}>
                        <TableCell>
                          <div className="flex flex-col gap-y-1">
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center">
                                <img src={position.totalEarnings[0]?.img} alt={position.totalEarnings[0]?.symbol} className="w-6 h-6 rounded-full" />
                                <img src={position.totalEarnings[1]?.img} alt={position.totalEarnings[1]?.symbol} className="w-6 h-6 rounded-full -ml-2" />
                              </div>
                              <span>{position.totalEarnings[0]?.symbol} - {position.totalEarnings[1]?.symbol}</span>
                            </div>
                            <div className="text-xs capitalize text-muted-foreground">
                              <span className="font-semibold capitalize">{position.poolType.toLowerCase()}</span> | <span>{parseFloat(position.feeTier).toFixed(2)}%</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {position.poolType === 'CLMM' ? `${position.min} - ${position.max}` : 'Full Range'}
                        </TableCell>
                        <TableCell>${parseFloat(position.initialDeposits.reduce((acc, deposit) => acc + parseFloat(deposit.amount), 0).toFixed(2))}</TableCell>
                        <TableCell>{parseFloat(position.apr.totalAprPercentage).toFixed(2)}%</TableCell>
                        <TableCell>${totalEarnings.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="icon" variant="ghost" onClick={() => handleRemoveLiquidity(position)}>
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleClaimRewards(position.positionAddr)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex gap-y-4 flex-col items-center mt-6 justify-center min-h-[200px] bg-background rounded-lg p-6">
              <svg
                className="w-16 h-16 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                ></path>
              </svg>

              <div className="text-muted-foreground text-center text-lg font-medium">
                <p>{!connected ? <p className="flex gap-y-4 flex-col items-center space-x-2">
                  Please connect your wallet to view your positions
                  <span><WalletSelector /></span>
                </p> : 'No positions found'}</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
        <DialogContent>
          <DialogHeader className="mb-4">
            <DialogTitle>Deposit to {selectedPool?.pool.token1Info.symbol}/{selectedPool?.pool.token2Info.symbol}</DialogTitle>
          </DialogHeader>
          <div className="gap-y-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-y-4">
                <Label className="flex gap-x-2 items-center"><img src={selectedPool?.pool.token1Info.logoUrl} className="w-6 h-6 rounded-full" /> {selectedPool?.pool.token1Info.symbol}</Label>
                <Input
                  type="number"
                  value={amountA}
                  onChange={(e) => setAmountA(e.target.value)}
                  placeholder={`Enter amount in ${selectedPool?.pool.token1Info.symbol}`}
                />

                <div className="flex items-center gap-x-2">
                  <Wallet className="w-4 h-4" />
                  {(() => {
                    const rawBalance = appBalances.get(selectedPool?.pool.token1Info.addr);
                    const decimals = tokens.find((token) => token.faAddress === selectedPool?.pool.token1Info.addr)?.decimals;
                    const formattedBalance = decimals
                      ? (rawBalance / Math.pow(10, decimals)).toFixed(4)
                      : '0';

                    return (
                      <>
                        <p>{formattedBalance}</p>
                        <Button
                          onClick={() => setAmountA(formattedBalance)}
                          variant="outline"
                        >
                          Max
                        </Button>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="flex flex-col gap-y-4">
                <Label className="flex gap-x-2 items-center" ><img src={selectedPool?.pool.token2Info.logoUrl} className="w-6 h-6 rounded-full" /> {selectedPool?.pool.token2Info.symbol}</Label>
                <Input
                  type="number"
                  value={amountB}
                  onChange={(e) => setAmountB(e.target.value)}
                  placeholder={`Enter amount in ${selectedPool?.pool.token2Info.symbol}`}
                />
                <div className="flex items-center gap-x-2 justify-end">
                  <Wallet className="w-4 h-4" />
                  {(() => {
                    const rawBalance = appBalances.get(selectedPool?.pool.token2Info.addr);
                    const decimals = tokens.find((token) => token.faAddress === selectedPool?.pool.token2Info.addr)?.decimals;
                    const formattedBalance = decimals
                      ? (rawBalance / Math.pow(10, decimals)).toFixed(4)
                      : '0';

                    return (
                      <>
                        <p>{formattedBalance}</p>
                        <Button
                          onClick={() => setAmountB(formattedBalance)}
                          variant="outline"
                        >
                          Max
                        </Button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            {connected ? (
              (parseFloat(amountA) > 0 && parseFloat(amountB) > 0) ? (
                <Button onClick={handleDeposit}>Confirm Deposit</Button>
              ) : (
                <Button disabled>Confirm Deposit</Button>
              )
            ) : (
              <WalletSelector />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TappExchangePage;