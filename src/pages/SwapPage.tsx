import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { InputTransactionData } from "@aptos-labs/wallet-adapter-core";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeftRight, Settings, ArrowUpDown } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useTokenStore } from '@/store/tokenStore';
import { toast } from '@/components/ui/use-toast';
import { toHexString, conditionalFixed } from '@/lib';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { aptosClient } from '@/lib';
import { TransactionHash } from "../components/TransactionHash";
import tokens from '@/utils/tokens.json';
import { WalletSelector as ShadcnWalletSelector } from '@/components/WalletSelector';
import { TokenData } from '@/store/tokenStore';

const SwapPage: React.FC = () => {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromToken, setFromToken] = useState<string | null>(null);
  const [toToken, setToToken] = useState<string | null>(null);
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTokenType, setSelectedTokenType] = useState<'from' | 'to' | null>(null);
  const [countdown, setCountdown] = useState(15);

  const { account, connected, network, signAndSubmitTransaction } = useWallet();
  const { allTokens, setAllTokens, balances, setBalances } = useTokenStore();
  const [tokenListLoading, setTokenListLoading] = useState(false);

  const panoraApiKey = import.meta.env.VITE_PANORA_API_KEY || '';
  const baseUrl = 'https://api.panora.exchange';
  const integratorFeeAddress = import.meta.env.VITE_PANORA_INTEGRATOR_FEE_ADDRESS || '';
  const integratorFeePercentage = parseFloat(import.meta.env.VITE_PANORA_INTEGRATOR_FEE_PERCENTAGE || '1');

  const getTokenAddress = (symbol: string): string => {
    return allTokens.find((t) => t.symbol === symbol)?.faAddress || '';
  };

  const ownerAddress = account?.address && typeof account.address === 'object' && 'data' in account.address
    ? toHexString((account.address as any).data)
    : account?.address;

  const aptosIndexerUrl = network?.name === 'testnet'
    ? import.meta.env.VITE_APTOS_TESTNET_INDEXER
    : import.meta.env.VITE_APTOS_MAINNET_INDEXER;

  const chainId = network?.name === 'mainnet' ? '1' : '2';

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
        fromTokenAddress: getTokenAddress(fromToken!),
        toTokenAddress: getTokenAddress(toToken!),
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

  // Debounce and auto-refresh logic
  useEffect(() => {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || fromToken === toToken || !fromToken || !toToken || !account?.address) {
      setToAmount('');
      setQuoteData({});
      setCountdown(15);
      return;
    }

    // Debounce the initial quote fetch
    const debounceTimeoutId = setTimeout(() => {
      fetchQuote();
      setCountdown(20); // Reset countdown after fetch
    }, 800);

    // Auto-refresh timer
    const intervalId = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchQuote();
          return 20; // Reset
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup
    return () => {
      clearTimeout(debounceTimeoutId);
      clearInterval(intervalId);
    };
  }, [fromAmount, fromToken, toToken, account, slippage]);



  useEffect(() => {
    setAllTokens(tokens as any);
    if (tokens.length > 0) {
      setFromToken(tokens[0].symbol);
      setToToken(tokens[1]?.symbol || tokens[0].symbol);
    }
  }, [setAllTokens]);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!connected || !ownerAddress) {
        setBalances(new Map());
        return;
      }
      try {
        const GET_USER_TOKEN_BALANCE = `
          query GetUserTokenBalance($owner_address: String!) {
            current_fungible_asset_balances(where: {owner_address: {_eq: $owner_address}}) {
              asset_type
              amount
              metadata { decimals }
            }
          }`;

        const response = await fetch(aptosIndexerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: GET_USER_TOKEN_BALANCE, variables: { owner_address: ownerAddress } }),
        });

        if (!response.ok) throw new Error('Failed to fetch balances');
        const result = await response.json();
        const newBalances = new Map<string, number>();
        result.data.current_fungible_asset_balances.forEach((balance: any) => {
          const amount = balance.amount / (10 ** balance.metadata.decimals);
          newBalances.set(balance.asset_type, amount);
        });
        setBalances(newBalances);
      } catch (error) {
        console.error('Failed to fetch balances:', error);
        setBalances(new Map());
      }
    };

    fetchBalances();
  }, [connected, ownerAddress, aptosIndexerUrl, setBalances]);

  const handleSwap = async () => {
    if (!fromAmount || !account?.address || fromToken === toToken || !fromToken || !toToken) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid amount and select different tokens.',
        variant: 'destructive',
      });
      return;
    }

    const fromTokenData = allTokens.find((t) => t.symbol === fromToken);
    const balance = fromTokenData ? balances.get(fromTokenData.tokenAddress) || 0 : 0;
    if (!fromTokenData || parseFloat(fromAmount) > balance) {
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
        fromTokenAddress: getTokenAddress(fromToken!),
        toTokenAddress: getTokenAddress(toToken!),
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

  const filteredTokens = (search: string, excludeSymbol: string | null = null) => {
    return allTokens.filter(
      (token) =>
        (token.symbol.toLowerCase().includes(search.toLowerCase()) ||
          token.name.toLowerCase().includes(search.toLowerCase())) &&
        token.symbol !== excludeSymbol
    );
  };

  const openSidebar = (type: 'from' | 'to') => {
    setSelectedTokenType(type);
    setIsSidebarOpen(true);
  };

  const selectToken = (symbol: string) => {
    if (selectedTokenType === 'from') {
      setFromToken(symbol);
    } else if (selectedTokenType === 'to') {
      setToToken(symbol);
    }
    setIsSidebarOpen(false);
    setSelectedTokenType(null);
  };

  return (
    <div className="max-w-md mx-auto space-y-6 relative">
      <Card className="vault-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Swap Tokens
            <div className="flex items-center space-x-2">
              {fromAmount && parseFloat(fromAmount) > 0 && (
                <span className="text-sm bg-primary p-2 rounded text-primary-foreground font-normal">{countdown}s</span>
              )}
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
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => setSlippage(0.3)}
                          className={`px-8 py-2 rounded-md text-sm font-medium transition-colors ${slippage === 0.3
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                        >
                          0.3%
                        </button>
                        <button
                          onClick={() => setSlippage(0.5)}
                          className={`px-8 py-2 rounded-md text-sm font-medium transition-colors ${slippage === 0.5
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                        >
                          0.5%
                        </button>
                        <button
                          onClick={() => setSlippage(1)}
                          className={`px-8 py-2 rounded-md text-sm font-medium transition-colors ${slippage === 1
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                        >
                          1%
                        </button>
                      </div>
                      <div className="text-xs text-muted-foreground mt-3">
                        Recommended: 0.5-1%. Higher slippage increases chance of execution but may result in worse price.
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">From</label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    const tokenData = allTokens.find((t) => t.symbol === fromToken);
                    const balance = tokenData ? balances.get(tokenData.tokenAddress) || 0 : 0;
                    if (parseFloat(value) > balance) {
                      setFromAmount(balance.toString());
                    } else {
                      setFromAmount(value);
                    }
                  }}
                  className="text-lg"
                  type="number"
                  min="0"
                  max={(() => {
                    const tokenData = allTokens.find((t) => t.symbol === fromToken);
                    return (tokenData ? balances.get(tokenData.tokenAddress) || 0 : 0).toString();
                  })()}
                  step="any"
                  disabled={tokenListLoading || isLoading}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => openSidebar('from')}
                disabled={tokenListLoading || isLoading}
                className="w-32 flex items-center justify-between"
              >
                {fromToken ? (
                  <>
                    <img
                      src={allTokens.find((t) => t.symbol === fromToken)?.logoUrl}
                      alt={fromToken}
                      className="h-5 w-5 rounded-full mr-2"
                    />
                    {fromToken}
                  </>
                ) : 'Select Token'}
              </Button>
            </div>
            <div className="flex justify-between items-center mt-1">
              <div className="text-xs text-muted-foreground">
                Balance: {(() => {
                  const tokenData = allTokens.find((t) => t.symbol === fromToken);
                  return (tokenData ? balances.get(tokenData.tokenAddress) || 0 : 0).toFixed(2);
                })()}
              </div>
              <div className="flex space-x-1">
                {[0.25, 0.5, 0.75, 1].map((percentage) => (
                  <Button
                    key={percentage}
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      const tokenData = allTokens.find((t) => t.symbol === fromToken);
                      const balance = tokenData ? balances.get(tokenData.tokenAddress) || 0 : 0;
                      setFromAmount((balance * percentage).toString());
                    }}
                  >
                    {percentage === 1 ? 'Max' : `${percentage * 100}%`}
                  </Button>
                ))}
              </div>
            </div>
          </div>

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
              <Button
                variant="outline"
                onClick={() => openSidebar('to')}
                disabled={tokenListLoading || isLoading}
                className="w-32 flex items-center justify-between"
              >
                {toToken ? (
                  <>
                    <img
                      src={allTokens.find((t) => t.symbol === toToken)?.logoUrl}
                      alt={toToken}
                      className="h-5 w-5 rounded-full mr-2"
                    />
                    {toToken}
                  </>
                ) : 'Select Token'}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Balance: {(() => {
                const tokenData = allTokens.find((t) => t.symbol === toToken);
                return (tokenData ? balances.get(tokenData.tokenAddress) || 0 : 0).toFixed(2);
              })()}
            </div>
          </div>

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

         {connected ? <Button
            className="w-full vault-button"
            disabled={!fromAmount || fromToken === toToken || isLoading || tokenListLoading || !account || !fromToken || !toToken}
            onClick={handleSwap}
          >
            {isLoading ? 'Processing...' : !fromAmount ? 'Enter Amount' : 'Swap'}
          </Button> : <ShadcnWalletSelector className="w-full vault-button" />}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        Powered by{' '}
        <a href="https://panora.exchange" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          Panora
        </a>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div
            className="w-1/3 bg-gray-900 text-white h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-700">
              <Input
                placeholder="Search by name, symbol, emoji or address..."
                value={selectedTokenType === 'from' ? fromSearch : toSearch}
                onChange={(e) => {
                  if (selectedTokenType === 'from') setFromSearch(e.target.value);
                  else setToSearch(e.target.value);
                }}
                className="w-full bg-gray-800 text-white border-gray-700"
              />
              <Button
                variant="ghost"
                onClick={() => setIsSidebarOpen(false)}
                className="mt-2 text-white"
              >
                Close
              </Button>
            </div>
            <div className="p-4 space-y-2">
              {filteredTokens(selectedTokenType === 'from' ? fromSearch : toSearch, selectedTokenType === 'from' ? toToken : fromToken).map((token) => {
                const balance = balances.get(token.tokenAddress) || 0;
                return (
                  <div
                    key={token.symbol}
                    className="flex items-center justify-between p-2 hover:bg-gray-800 rounded cursor-pointer"
                    onClick={() => selectToken(token.symbol)}
                  >
                    <div className="flex items-center space-x-2">
                      <img src={token.logoUrl} alt={token.symbol} className="h-6 w-6 rounded-full" />
                      <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-xs text-gray-400">{token.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div>{balance.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">&lt;$0.01</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapPage;