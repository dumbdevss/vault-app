import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import protocol from "@/utils/protocols.json";
import { useEffect, useState } from "react";
import { aptosClient, toHexString } from '@/lib';
import { Skeleton } from "@/components/ui/skeleton";

export default function TappExchangePage() {
  const { account } = useWallet();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ownerAddress =
    account?.address && typeof account.address === "object" && "data" in account.address
      ? toHexString((account.address as any).data)
      : account?.address;

  const tappExchangeProtocol = protocol.find((protocol: any) => protocol.name === "TappExchange");

  // Placeholder for calculateChange function (needs implementation based on your requirements)
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  useEffect(() => {
    const fetchProtocolData = async () => {
      setLoading(true);
      try {
        if (!tappExchangeProtocol) {
          throw new Error("TappExchange protocol not found in protocols.json");
        }

        const protocolId =
          tappExchangeProtocol.llama_id ||
          tappExchangeProtocol.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

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
        setError(err.message);
        console.error("Error fetching data for LiquidSwap:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProtocolData();
  }, []);

  const navigate = useNavigate();

  return (
    <div className="mx-auto flex flex-col gap-y-12 relative">
      <Button className="w-max" variant="outline" onClick={() => navigate("/platforms")}>
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
      {loading && <div className="mb-4 flex items-center gap-x-4">
        <Skeleton className="vault-bg w-24 h-4" />
        <Skeleton className="vault-bg w-24 h-4" />
        <Skeleton className="vault-bg w-24 h-4" />
        <Skeleton className="vault-bg w-24 h-4" />
        <Skeleton className="vault-bg w-24 h-4" />
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
  );
}