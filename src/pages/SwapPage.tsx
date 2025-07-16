import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { InputTransactionData } from "@aptos-labs/wallet-adapter-core";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeftRight, Settings, ArrowUpDown } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useTokenStore, CombinedTokenData } from '@/store/tokenStore';
import { toast } from '@/components/ui/use-toast';
import { toHexString, conditionalFixed } from '@/lib';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { aptosClient } from '@/lib';
import { TransactionHash } from "../components/TransactionHash";
import tokens from '@/utils/tokens.json';

const SwapPage: React.FC = () => {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromToken, setFromToken] = useState('');
  const [toToken, setToToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quoteData, setQuoteData] = useState<{
    exchangeRate?: string;
    priceImpact?: number;
    networkFee?: number;
    slippagePercentage?: number;
  }>({});
  const [slippage, setSlippage] = useState(parseFloat(import.meta.env.VITE_PANORA_SLIPPAGE_PERCENTAGE || '1'));
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');

  const { account, connected, network, signAndSubmitTransaction } = useWallet();
  const { tokens: ownedTokens, setTokens, allTokens, setAllTokens } = useTokenStore();
  const [tokenListLoading, setTokenListLoading] = useState(true);

  // Environment variables with fallback
  const panoraApiKey = import.meta.env.VITE_PANORA_API_KEY || '';
  const baseUrl = 'https://api.panora.exchange';
  const integratorFeeAddress = import.meta.env.VITE_PANORA_INTEGRATOR_FEE_ADDRESS || '';
  const integratorFeePercentage = parseFloat(import.meta.env.VITE_PANORA_INTEGRATOR_FEE_PERCENTAGE || '1');

  // Get token address from symbol
  const getTokenAddress = (symbol: string): string => {
    return [...ownedTokens, ...allTokens].find((t) => t.symbol === symbol)?.tokenAddress || '';
  };

  const ownerAddress = account?.address && typeof account.address === 'object' && 'data' in account.address
    ? toHexString((account.address as any).data)
    : account?.address;

  const aptosIndexerUrl = network?.name === 'testnet'
    ? import.meta.env.VITE_APTOS_TESTNET_INDEXER
    : import.meta.env.VITE_APTOS_MAINNET_INDEXER;

  const chainId = network?.name === 'mainnet' ? '1' : '2';

  // Debounced fetch quote function
  const fetchQuote = useCallback(async () => {
    if (!fromAmount || !account?.address || fromToken === toToken || !fromToken || !toToken) {
      setToAmount('');
      setQuoteData({});
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        chainId,
        fromTokenAddress: getTokenAddress(fromToken),
        toTokenAddress: getTokenAddress(toToken),
        fromTokenAmount: fromAmount,
        toWalletAddress: ownerAddress as string,
        slippagePercentage: slippage.toString(),
        integratorFeeAddress,
        integratorFeePercentage: integratorFeePercentage.toString(),
      });

      const response = await fetch(`${baseUrl}/swap/quote?${params.toString()}`, {
        headers: {
          'x-api-key': panoraApiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const quote = await response.json();
      const exchangeRate = parseFloat(quote.fromToken.current_price) / parseFloat(quote.toToken.current_price);
      const calculatedToAmount = parseFloat(fromAmount) * exchangeRate;

      setToAmount(conditionalFixed(calculatedToAmount, 6) || '');
      setQuoteData({
        exchangeRate: conditionalFixed(exchangeRate, 6) || '1',
        slippagePercentage: slippage,
        priceImpact: Number(quote.priceImpact) || 0.1,
        networkFee: Number(quote.feeAmountUSD) || 0.02,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch swap quote. Please try again.',
        variant: 'destructive',
      });
      console.error('Quote error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fromAmount, fromToken, toToken, account, slippage, chainId, ownerAddress, integratorFeeAddress, integratorFeePercentage, panoraApiKey, baseUrl, getTokenAddress, toast]);

  // Debounce effect for quote fetching
  useEffect(() => {
    if (!fromAmount || fromToken === toToken || !fromToken || !toToken || !account?.address) {
      setToAmount('');
      setQuoteData({});
      return;
    }

    // Create a debounced function
    const timeoutId = setTimeout(() => {
      fetchQuote();
    }, 800); // 800ms delay - adjust as needed

    // Cleanup function to cancel the timeout if dependencies change
    return () => clearTimeout(timeoutId);
  }, [fromAmount, fromToken, toToken, account, slippage]);

  // Fetch tokens
  useEffect(() => {
    const fetchTokens = async () => {
      // Only proceed if wallet is connected
      if (!connected || !ownerAddress) {
        setTokenListLoading(false);
        return;
      }

      setTokenListLoading(true);
      try {
        // Fetch Panora token list
        const query = { panoraUI: 'true', chainId, panoraTags: "Verified" };
        const queryString = new URLSearchParams(query);
        const url = `https://api.panora.exchange/tokenlist?${queryString}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'x-api-key': panoraApiKey },
        });

        if (!response.ok) throw new Error('Failed to fetch token list');
        const panoraTokens = await response.json();

        const mappedTokens = panoraTokens?.data
          ?.map((token: any) => ({
            tokenAddress: token.tokenAddress,
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            icon_uri: token.logoUrl,
            usdPrice: token.usdPrice,
            amount: 0,
            asset_type: token.tokenAddress,
          }))
          .filter((token: any, index: number, array: any[]) =>
            array.findIndex(t => t.symbol === token.symbol) === index
          );
        setAllTokens(mappedTokens);

        const GET_USER_TOKEN_BALANCE = `
        query GetUserTokenBalance($owner_address: String!) {
          current_fungible_asset_balances(
            where: { owner_address: { _eq: $owner_address } }
          ) {
            asset_type
            amount
            metadata { icon_uri name symbol decimals }
          }
        }
      `;

        const balanceResponse = await fetch(aptosIndexerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: GET_USER_TOKEN_BALANCE,
            variables: { owner_address: ownerAddress },
          }),
        });

        if (!balanceResponse.ok) throw new Error('Failed to fetch balances');
        const balanceResult = await balanceResponse.json();
        const balances = balanceResult.data.current_fungible_asset_balances;

        // Combine data
        const combinedData = balances.map((balance: any) => {
          const tokenInfo = panoraTokens?.data.find((token: any) => token.tokenAddress === balance.asset_type);
          return {
            ...balance,
            usdPrice: tokenInfo?.usdPrice || '0',
            icon_uri: balance.metadata.icon_uri || tokenInfo?.logoUrl || '',
            symbol: balance.metadata.symbol,
            name: balance.metadata.name,
            decimals: balance.metadata.decimals,
            amount: balance.amount / (10 ** balance.metadata.decimals),
            tokenAddress: balance.asset_type,
          };
        });

        setTokens(combinedData);

        // Set default fromToken to first owned token if available
        if (combinedData.length > 0) {
          setFromToken(combinedData[0].symbol);
        }
      } catch (error) {
        console.error('Failed to fetch token data:', error);
        toast({
          title: 'Error',
          description: 'Could not load token balances.',
          variant: 'destructive',
        });
      } finally {
        setTokenListLoading(false);
      }
    };

    fetchTokens();
  }, [connected, ownerAddress, aptosIndexerUrl, setTokens, setAllTokens, chainId, panoraApiKey, toast]);

  const handleSwap = async () => {
    if (!fromAmount || !account?.address || fromToken === toToken || !fromToken || !toToken) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid amount and select different tokens.',
        variant: 'destructive',
      });
      return;
    }

    const fromTokenData = ownedTokens.find((t) => t.symbol === fromToken) || allTokens.find((t) => t.symbol === fromToken);
    if (!fromTokenData || (ownedTokens.length > 0 && parseFloat(fromAmount) > fromTokenData.amount)) {
      toast({
        title: 'Insufficient Balance',
        description: `You don't have enough ${fromTokenData?.symbol || fromToken} to complete this swap.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        chainId,
        fromTokenAddress: getTokenAddress(fromToken),
        toTokenAddress: getTokenAddress(toToken),
        fromTokenAmount: fromAmount,
        toWalletAddress: ownerAddress as string,
        slippagePercentage: slippage.toString(),
        integratorFeeAddress,
        integratorFeePercentage: integratorFeePercentage.toString(),
      });

      const response = await fetch(`${baseUrl}/swap?${params.toString()}`, {
        method: 'POST',
        headers: {
          'x-api-key': panoraApiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const swapData = await response.json();
      console.log('swapData', swapData);

      const transaction: InputTransactionData = {
        data: {
          function: swapData?.quotes[0]?.txData?.function || '',
          functionArguments: swapData?.quotes[0]?.txData?.arguments || [],
          typeArguments: swapData?.quotes[0]?.txData?.type_arguments || [],
        },
      };

      const txResponse = await signAndSubmitTransaction({
        ...transaction,
        pluginParams: {
          customParam: "customValue",
        },
      });

      await aptosClient(network).waitForTransaction({
        transactionHash: txResponse.hash,
      });

      if (txResponse.hash) {
        toast({
          title: "Success",
          description: <TransactionHash hash={txResponse.hash} network={network} />,
        });
        setFromAmount('');
        setToAmount('');

      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Swap failed. Please try again.',
        variant: 'destructive',
      });
      console.error('Swap error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const swapTokens = () => {
    if (fromToken === toToken || !fromToken || !toToken) return;
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount('');
    setToAmount('');
  };

  // Filter tokens based on search
  const filteredFromTokens = (ownedTokens.length > 0 ? ownedTokens : allTokens).filter(
    (token) =>
      token.symbol.toLowerCase().includes(fromSearch.toLowerCase()) ||
      token.name.toLowerCase().includes(fromSearch.toLowerCase())
  );
  const filteredToTokens = allTokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(toSearch.toLowerCase()) ||
      token.name.toLowerCase().includes(toSearch.toLowerCase())
  );

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card className="vault-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              <span>Swap</span>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Swap Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Slippage Tolerance (%)</Label>
                    <Input
                      type="number"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={slippage}
                      onChange={(e) => setSlippage(Number(e.target.value))}
                      className="mt-1"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Recommended: 0.5-3%. Higher slippage increases chance of execution but may result in worse price.
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* From Token */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">From</label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    const balance = ((ownedTokens.length > 0 ? ownedTokens : allTokens).find((t) => t.symbol === fromToken)?.amount || 0);
                    if (parseFloat(value) > balance) {
                      setFromAmount(balance.toString());
                    } else {
                      setFromAmount(value);
                    }
                  }}
                  className="text-lg"
                  type="number"
                  min="0"
                  max={((ownedTokens.length > 0 ? ownedTokens : allTokens).find((t) => t.symbol === fromToken)?.amount || 0).toFixed(2)}
                  step="any"
                  disabled={tokenListLoading || isLoading}
                />
              </div>
              <Select value={fromToken} onValueChange={setFromToken} disabled={tokenListLoading || isLoading}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                  {fromToken && (
                    <img
                      src={(ownedTokens.length > 0 ? ownedTokens : allTokens).find((t) => t.symbol === fromToken)?.icon_uri}
                      alt={fromToken}
                      className="h-5 w-5 rounded-full ml-2"
                    />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <Input
                    placeholder="Search tokens..."
                    value={fromSearch}
                    onChange={(e) => setFromSearch(e.target.value)}
                    className="mb-2 mx-2"
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  {filteredFromTokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol} disabled={token.symbol === toToken}>
                      <div className="flex items-center space-x-2">
                        <img src={token.icon_uri} alt={token.symbol} className="h-5 w-5 rounded-full" />
                        <span className="font-medium">{token.symbol}</span>
                        <span className="text-xs text-muted-foreground">{token.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center mt-1">
              <div className="text-xs text-muted-foreground">
                Balance: {((ownedTokens.length > 0 ? ownedTokens : allTokens).find((t) => t.symbol === fromToken)?.amount || 0).toFixed(2)}
              </div>
              <div className="flex space-x-1">
                {[0.25, 0.5, 0.75, 1].map((percentage) => (
                  <Button
                    key={percentage}
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      const balance = (ownedTokens.length > 0 ? ownedTokens : allTokens).find((t) => t.symbol === fromToken)?.amount || 0;
                      setFromAmount((balance * percentage).toString());
                    }}
                  >
                    {percentage === 1 ? 'Max' : `${percentage * 100}%`}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={swapTokens}
              className="rounded-full border-2"
              disabled={tokenListLoading || isLoading || !fromToken || !toToken}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">To</label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  placeholder="0.0"
                  value={toAmount}
                  className="text-lg"
                  readOnly
                  disabled={tokenListLoading || isLoading}
                />
              </div>
              <Select value={toToken} onValueChange={setToToken} disabled={tokenListLoading || isLoading}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                  {toToken && (
                    <img
                      src={allTokens.find((t) => t.symbol === toToken)?.icon_uri}
                      alt={toToken}
                      className="h-5 w-5 rounded-full ml-2"
                    />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <Input
                    placeholder="Search tokens..."
                    value={toSearch}
                    onChange={(e) => setToSearch(e.target.value)}
                    className="mb-2 mx-2"
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  {filteredToTokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol} disabled={token.symbol === fromToken}>
                      <div className="flex items-center space-x-2">
                        <img src={token.icon_uri} alt={token.symbol} className="h-5 w-5 rounded-full" />
                        <span className="font-medium">{token.symbol}</span>
                        <span className="text-xs text-muted-foreground">{token.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              Balance: {ownedTokens.find((t) => t.symbol === toToken)?.amount.toFixed(2) || '0.00'}
            </div>
          </div>

          {/* Swap Details */}
          {fromAmount && quoteData.exchangeRate && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Exchange Rate</span>
                <span>1 {fromToken} = {quoteData.exchangeRate} {toToken}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price Impact</span>
                <span className={quoteData.priceImpact < 1 ? 'text-green-500' : 'text-red-500'}>
                  {quoteData.priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network Fee</span>
                <span>~${quoteData.networkFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Slippage Tolerance</span>
                <span>{slippage}%</span>
              </div>
            </div>
          )}

          {/* Swap Button */}
          <Button
            className="w-full vault-button"
            disabled={!fromAmount || fromToken === toToken || isLoading || tokenListLoading || !account || !fromToken || !toToken}
            onClick={handleSwap}
          >
            {isLoading ? 'Processing...' : !account ? 'Connect Wallet' : !fromAmount ? 'Enter Amount' : 'Swap'}
          </Button>
        </CardContent>
      </Card>

      {/* Powered by Panora */}
      <div className="text-center text-sm text-muted-foreground">
        Powered by{' '}
        <a href="https://panora.exchange" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          Panora
        </a>
      </div>
    </div>
  );
};

export default SwapPage;