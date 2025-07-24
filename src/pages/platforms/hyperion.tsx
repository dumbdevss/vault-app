import { Network } from "@aptos-labs/ts-sdk";
import { initHyperionSDK, FeeTierIndex, priceToTick } from '@hyperionxyz/sdk';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUp, ArrowDown, ArrowLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import protocols from '@/utils/protocols.json';
import { useNavigate } from 'react-router-dom';
import { aptosClient, toHexString } from '@/lib';
import { Arrow } from "@radix-ui/react-tooltip";
import { Skeleton } from "@/components/ui/skeleton";

interface TokenInfo {
	assetType: string;
	bridge: string | null;
	coinMarketcapId: string;
	coinType: string;
	coingeckoId: string;
	decimals: number;
	faType: string;
	hyperfluidSymbol: string;
	logoUrl: string;
	name: string;
	symbol: string;
	isBanned: boolean;
	websiteUrl: string | null;
}

interface Pool {
	currentTick: number;
	feeRate: string;
	feeTier: number;
	poolId: string;
	senderAddress: string;
	sqrtPrice: string;
	token1: string;
	token2: string;
	token1Info: TokenInfo;
	token2Info: TokenInfo;
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

interface Subsidy {
	claimed: Array<{
		amount: string;
		amountUSD: string;
		token: string;
	}>;
	unclaimed: Array<{
		amount: string;
		amountUSD: string;
		token: string;
	}>;
}

interface Fee {
	claimed: Array<{
		amount: string;
		amountUSD: string;
		token: string;
	}>;
	unclaimed: Array<{
		amount: string;
		amountUSD: string;
		token: string;
	}>;
}

interface Position {
	isActive: boolean;
	value: string;
	subsidy: Subsidy;
	fees: Fee;
	position: {
		objectId: string;
		poolId: string;
		tickLower: number;
		tickUpper: number;
		createdAt: string;
		pool: Pool;
	};
}

const aptosApiKey = import.meta.env.VITE_APTOS_API_KEY;

const sdk = initHyperionSDK({
	network: Network.MAINNET,
	APTOS_API_KEY: aptosApiKey,
});

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

const calculateChange = (current: number, previous: number): number => {
	if (previous === 0) return 0;
	const change = ((current - previous) / previous) * 100;
	return isNaN(change) ? 0 : change;
};

interface PoolsTableProps {
	pools: PoolItem[];
	setSelectedPool: (pool: PoolItem | null) => void;
	setIsDepositModalOpen: (isOpen: boolean) => void;
	setFeeIndex: (feeIndex: number) => void;
}

const PoolsTable: React.FC<PoolsTableProps> = ({ pools, setSelectedPool, setIsDepositModalOpen, setFeeIndex }) => {
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
						<TableHead className="cursor-pointer  text-foreground ">
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
							<TableCell className="text-xs">
								<div className="flex items-center">
									<div className="flex items-center">
										<img src={pool.pool.token1Info.logoUrl} alt={pool.pool.token1Info.symbol} className="w-6 h-6 rounded-full" />
										<img src={pool.pool.token2Info.logoUrl} alt={pool.pool.token2Info.symbol} className="w-6 h-6 rounded-full -ml-2" />
									</div>
									<span className="ml-2">{pool.pool.token1Info.symbol}/{pool.pool.token2Info.symbol}</span>
								</div>
							</TableCell>
							<TableCell className="text-xs">{formatLargeNumber(parseFloat(pool.tvlUSD))}</TableCell>
							<TableCell className="text-xs">{formatLargeNumber(parseFloat(pool.dailyVolumeUSD))}</TableCell>
							<TableCell className="text-xs">{formatLargeNumber(parseFloat(pool.feesUSD))}</TableCell>
							<TableCell className="text-xs">
								<span>
									{(parseFloat(pool.feeAPR) + parseFloat(pool.farmAPR)).toFixed(2)}%
								</span>
							</TableCell>
							<TableCell className="text-xs">
								<Button
									onClick={() => {
										setSelectedPool(pool);
										setFeeIndex(pool.pool.feeTier);
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

const HyperionPage = () => {
	const [data, setData] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [pools, setPools] = useState<PoolItem[]>([]);
	const [positions, setPositions] = useState<Position[]>([]);
	const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
	const [selectedPool, setSelectedPool] = useState<PoolItem | null>(null);
	const [amountA, setAmountA] = useState('');
	const [feeIndex, setFeeIndex] = useState(0);
	const navigate = useNavigate();

	const { account, signAndSubmitTransaction } = useWallet();

	const ownerAddress = account?.address && typeof account.address === 'object' && 'data' in account.address
		? toHexString((account.address as any).data)
		: account?.address;
	const hyperionProtocol = protocols.find(p => p.name === 'Hyperion');

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
	}

	useEffect(() => {
		const fetchProtocolData = async () => {
			setLoading(true);
			try {
				if (!hyperionProtocol) {
					throw new Error('Hyperion protocol not found in protocols.json');
				}

				const protocolId = hyperionProtocol.llama_id || hyperionProtocol.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

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
				console.error('Error fetching data for Hyperion:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchProtocolData();
	}, []);

	useEffect(() => {
		fetchAllPools();
		if (ownerAddress) {
			fetchPositions();
		}
	}, [ownerAddress]);

	/**
	 * Fetches all pools and their associated ticks from the SDK.
	 * Logs the fetched ticks and pool items to the console.
	 * Updates the state with the fetched pool items.
	 * Catches and logs any errors encountered during the fetching process.
	 */
	const fetchAllPools = async () => {
		try {
			const poolItems: PoolItem[] = await sdk.Pool.fetchAllPools();
			setPools(poolItems);
		} catch (error) {
			console.error('Error fetching pools:', error);
		}
	};

	const fetchPositions = async () => {
		try {
			const positionItems: Position[] = await sdk.Position.fetchAllPositionsByAddress({
				address: ownerAddress as string,
			});
			setPositions(positionItems);
		} catch (error) {
			console.error('Error fetching positions:', error);
		}
	};

	const handleDeposit = async () => {
		if (!selectedPool || !ownerAddress) return;

		try {
			const ticks = await sdk.Pool.fetchTicks({
				poolId: selectedPool.pool.poolId,
			})

			const feeTierIndex = selectedPool.pool.feeTier;
			const currencyAAmount = Math.pow(10, selectedPool.pool.token1Info.decimals) * parseFloat(amountA);

			let tickLower = ticks[0].tick;
			let tickUpper = ticks[1].tick;

			const [, currencyBAmount] = await sdk.Pool.estCurrencyBAmountFromA({
				currencyA: selectedPool.pool.token1Info.faType,
				currencyB: selectedPool.pool.token2Info.faType,
				currencyAAmount,
				feeTierIndex,
				tickLower,
				tickUpper,
				currentPriceTick: selectedPool.pool.currentTick,
			});

			const params = {
				positionId: selectedPool.id,
				currencyA: selectedPool.pool.token1Info.coinType,
				currencyB: selectedPool.pool.token2Info.coinType,
				currencyAAmount,
				currencyBAmount,
				slippage: '0.1',
				feeTierIndex,
			};

			const payload = await sdk.Position.addLiquidityTransactionPayload(params as any);
			await signAndSubmitTransaction(payload);
			setIsDepositModalOpen(false);
			setAmountA('');
		} catch (error) {
			console.error('Error depositing liquidity:', error);
			setError(error instanceof Error ? error.message : 'Failed to deposit liquidity');
		}
	};

	const handleRemoveLiquidity = async (position: Position) => {
		try {
			const positionData = await sdk.Position.fetchPositionById({
				positionId: position.position.objectId,
				address: ownerAddress as string,
			});

			const [currencyAAmount, currencyBAmount] = await sdk.Position.fetchTokensAmountByPositionId({
				positionId: position.position.objectId,
			});

			const removeRatio = 0.5; // 50% removal as example
			const params = {
				positionId: position.position.objectId,
				currencyA: position.position.pool.token1Info.coinType,
				currencyB: position.position.pool.token2Info.coinType,
				currencyAAmount: currencyAAmount * removeRatio,
				currencyBAmount: currencyBAmount * removeRatio,
				deltaLiquidity: positionData[0].currentAmount * removeRatio,
				slippage: 0.1,
				recipient: ownerAddress as string,
			};

			const payload = await sdk.Position.removeLiquidityTransactionPayload(params);
			await signAndSubmitTransaction(payload);
			await fetchPositions();
		} catch (error) {
			console.error('Error removing liquidity:', error);
			setError(error instanceof Error ? error.message : 'Failed to remove liquidity');
		}
	};

	const handleClaimFees = async (positionId: string) => {
		try {
			const payload = await sdk.Position.claimFeeTransactionPayload({
				positionId,
				recipient: ownerAddress as string,
			});
			await signAndSubmitTransaction(payload as any);
			await fetchPositions();
		} catch (error) {
			console.error('Error claiming fees:', error);
			setError(error instanceof Error ? error.message : 'Failed to claim fees');
		}
	};

	const handleClaimRewards = async (positionId: string) => {
		try {
			const payload = await sdk.Position.claimRewardTransactionPayload({
				positionId,
				recipient: ownerAddress as string,
			});
			await signAndSubmitTransaction(payload as any);
			await fetchPositions();
		} catch (error) {
			console.error('Error claiming rewards:', error);
			setError(error instanceof Error ? error.message : 'Failed to claim rewards');
		}
	};

	return (
		<div>
			<div className="mx-auto flex flex-col gap-y-12 relative">
				<Button className="w-max" variant="outline" onClick={() => navigate('/platforms')}><ArrowLeft />Back</Button>
				<div className="absolute backdrop-blur-sm left-1/2 right-0 -z-10 h-full max-w-[100vw] min-w-[calc(100vw-64px)] -translate-x-1/2 border-b transition-background bg-gradient-to-t from-primary/10 to-transparent"></div>
				<div className="flex gap-x-4 items-center mb-6">
					<div className="p-6 rounded-md bg-white">
						<img src={hyperionProtocol?.logo} alt={hyperionProtocol?.name} className="min-w-16 min-h-16 max-w-16 max-h-16" />
					</div>
					<div className="flex flex-col gap-y-2">
						<div className="flex items-center gap-x-2">
							<h1 className="text-2xl font-bold text-white">{hyperionProtocol?.name}</h1>
							<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" className="size-6 text-primary" data-sentry-element="SealCheck" data-sentry-source-file="platforms-grid.tsx"><path d="M225.86,102.82c-3.77-3.94-7.67-8-9.14-11.57-1.36-3.27-1.44-8.69-1.52-13.94-.15-9.76-.31-20.82-8-28.51s-18.75-7.85-28.51-8c-5.25-.08-10.67-.16-13.94-1.52-3.56-1.47-7.63-5.37-11.57-9.14C146.28,23.51,138.44,16,128,16s-18.27,7.51-25.18,14.14c-3.94,3.77-8,7.67-11.57,9.14C88,40.64,82.56,40.72,77.31,40.8c-9.76.15-20.82.31-28.51,8S41,67.55,40.8,77.31c-.08,5.25-.16,10.67-1.52,13.94-1.47,3.56-5.37,7.63-9.14,11.57C23.51,109.72,16,117.56,16,128s7.51,18.27,14.14,25.18c3.77,3.94,7.67,8,9.14,11.57,1.36,3.27,1.44,8.69,1.52,13.94.15,9.76.31,20.82,8,28.51s18.75,7.85,28.51,8c5.25.08,10.67.16,13.94,1.52,3.56,1.47,7.63,5.37,11.57,9.14C109.72,232.49,117.56,240,128,240s18.27-7.51,25.18-14.14c3.94-3.77,8-7.67,11.57-9.14,3.27-1.36,8.69-1.44,13.94-1.52,9.76-.15,20.82-.31,28.51-8s7.85-18.75,8-28.51c.08-5.25.16-10.67,1.52-13.94,1.47-3.56,5.37-7.63,9.14-11.57C232.49,146.28,240,138.44,240,128S232.49,109.73,225.86,102.82Zm-52.2,6.84-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z"></path></svg>
						</div>
						<p className="text-muted-foreground max-w-[70%]">{hyperionProtocol?.description}</p>
					</div>
				</div>
				{loading &&
					<div className="mb-4 flex items-center gap-x-4">
			  <Skeleton className="vault-bg w-32 h-8" />
            <Skeleton className="vault-bg w-24 h-8" />
            <Skeleton className="vault-bg w-24 h-8" />
            <Skeleton className="vault-bg w-24 h-8" />
            <Skeleton className="vault-bg w-24 h-8" />
					</div>}
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
					<PoolsTable pools={pools} setSelectedPool={setSelectedPool} setFeeIndex={setFeeIndex} setIsDepositModalOpen={setIsDepositModalOpen} />
				</TabsContent>
				<TabsContent value="positions">
					<div className="grid gap-4 mt-4">
						{positions.map((position) => (
							<Card key={position.position.objectId}>
								<CardHeader>
									<CardTitle>
										{position.position.pool.token1Info.symbol}/{position.position.pool.token2Info.symbol}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<p>Value: ${parseFloat(position.value).toLocaleString()}</p>
											<p>Tick Range: {position.position.tickLower} - {position.position.tickUpper}</p>
											<p>Unclaimed Fees: {position.fees.unclaimed.map((fee) => (
												`${parseFloat(fee.amountUSD).toFixed(6)} ${fee.token === position.position.pool.token1 ? position.position.pool.token1Info.symbol : position.position.pool.token2Info.symbol}`
											)).join(', ')}</p>
										</div>
										<div>
											<p>Unclaimed Rewards: {position.subsidy.unclaimed.map((reward) => (
												`${parseFloat(reward.amountUSD).toFixed(6)} ${reward.token === position.position.pool.token1 ? position.position.pool.token1Info.symbol : position.position.pool.token2Info.symbol}`
											)).join(', ')}</p>
											<div className="space-x-2 mt-2">
												<Button onClick={() => handleRemoveLiquidity(position)}>Remove Liquidity</Button>
												<Button onClick={() => handleClaimFees(position.position.objectId)}>Claim Fees</Button>
												<Button onClick={() => handleClaimRewards(position.position.objectId)}>Claim Rewards</Button>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>
			</Tabs>

			<Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Deposit to {selectedPool?.pool.token1Info.symbol}/{selectedPool?.pool.token2Info.symbol}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="flex flex-col gap-y-4">
							<Label>Amount {selectedPool?.pool.token1Info.symbol}</Label>
							<Input
								type="number"
								value={amountA}
								onChange={(e) => setAmountA(e.target.value)}
								placeholder={`Enter amount in ${selectedPool?.pool.token1Info.symbol}`}
							/>
						</div>
						<div className="flex gap-x-2">
							{['0.01', '0.05', '0.3', '1', '0.1', '0.25'].map((option: string) => (
								<Button variant="outline" className={feeIndex === getFeeIndex(option) ? 'bg-primary/80 text-primary-foreground px-4 rounded-md' : 'px-4 rounded-md'} onClick={() => setFeeIndex(getFeeIndex(option))}>{option}</Button>
							))}
						</div>
						<Button onClick={handleDeposit}>Confirm Deposit</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default HyperionPage;