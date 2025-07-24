import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { InputTransactionData } from "@aptos-labs/wallet-adapter-core";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, ArrowUpDown } from 'lucide-react';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const SwapPage: React.FC = () => {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromToken, setFromToken] = useState<string | null>(null); // Now stores token address
  const [toToken, setToToken] = useState<string | null>(null); // Now stores token address
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
  const queryClient = useQueryClient();
  const [filteredTokens, setFilteredTokens] = useState(allTokens);

  const panoraApiKey = import.meta.env.VITE_PANORA_API_KEY || '';
  const baseUrl = 'https://api.panora.exchange';
  const integratorFeeAddress = import.meta.env.VITE_PANORA_INTEGRATOR_FEE_ADDRESS || '';
  const integratorFeePercentage = parseFloat(import.meta.env.VITE_PANORA_INTEGRATOR_FEE_PERCENTAGE || '0.1');

  // Helper functions for token data
  const getTokenByAddress = (address: string) => {
    return allTokens.find((t) => t.tokenAddress === address || t.faAddress === address);
  };

  const getTokenAddress = (address: string): string => {
    const token = getTokenByAddress(address);
    return token?.tokenAddress || token?.faAddress || address; // Return the address itself as fallback
  };

  const getTokenSymbol = (address: string): string => {
    const token = getTokenByAddress(address);
    return token?.symbol || 'Unknown';
  };

  const getTokenName = (address: string): string => {
    const token = getTokenByAddress(address);
    return token?.name || 'Unknown Token';
  };

  const getTokenLogo = (address: string): string => {
    const token = getTokenByAddress(address);
    return token?.logoUrl || '';
  };

  const ownerAddress = account?.address && typeof account.address === 'object' && 'data' in account.address
    ? toHexString((account.address as any).data)
    : account?.address || '';

  // Validate network and set indexer URL
  const aptosIndexerUrl = network?.name === 'testnet'
    ? import.meta.env.VITE_APTOS_TESTNET_INDEXER
    : import.meta.env.VITE_APTOS_MAINNET_INDEXER || 'https://default-indexer-url'; // Add default fallback

  const chainId = network?.name === 'mainnet' ? '1' : '2';

  // Fetch quote using TanStack Query
  const quoteMutation = useMutation({
    mutationFn: async () => {
      if (!fromAmount || !ownerAddress || fromToken === toToken || !fromToken || !toToken) {
        throw new Error('Invalid parameters');
      }

      const params = new URLSearchParams({
        chainId,
        fromTokenAddress: getTokenAddress(fromToken) as string,
        toTokenAddress: getTokenAddress(toToken) as string,
        fromTokenAmount: fromAmount,
        toWalletAddress: ownerAddress as string,
        slippagePercentage: slippage.toString(),
        integratorFeeAddress: integratorFeeAddress as string,
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

      return {
        toAmount: conditionalFixed(calculatedToAmount, 6) || '',
        quoteData: {
          exchangeRate: conditionalFixed(exchangeRate, 6) || '1',
          slippagePercentage: slippage,
          priceImpact: Number(quote.priceImpact) || 0.1,
          networkFee: Number(quote.feeAmountUSD) || 0.02,
        },
      };
    },
    onSuccess: (data) => {
      setToAmount(data.toAmount);
      setQuoteData(data.quoteData);
    },
    onError: (error) => {
      setToAmount('');
      setQuoteData({});
      toast({
        title: 'Error',
        description: 'Failed to fetch swap quote. Please try again.',
        variant: 'destructive',
      });
      console.error('Quote error:', error);
    },
  });

  const fetchQuote = useCallback(() => {
    if (!fromAmount || !ownerAddress || fromToken === toToken || !fromToken || !toToken) {
      setToAmount('');
      setQuoteData({});
      return;
    }
    quoteMutation.mutate();
  }, [fromAmount, fromToken, toToken, ownerAddress, slippage, quoteMutation]);

  // Debounce and auto-refresh logic
  useEffect(() => {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || fromToken === toToken || !fromToken || !toToken || !ownerAddress) {
      setToAmount('');
      setQuoteData({});
      setCountdown(15);
      return;
    }

    const debounceTimeoutId = setTimeout(() => {
      fetchQuote();
      setCountdown(20);
    }, 800);

    const intervalId = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchQuote();
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(debounceTimeoutId);
      clearInterval(intervalId);
    };
  }, [fromAmount, fromToken, toToken, ownerAddress, slippage]);

  // Initialize tokens
  useEffect(() => {
    setAllTokens(tokens as any);
    setFilteredTokens(tokens as any);
    if (tokens.length > 0) {
      setFromToken(tokens[0].tokenAddress || tokens[0].faAddress);
      setToToken(tokens[1]?.tokenAddress || tokens[1]?.faAddress || tokens[0].tokenAddress || tokens[0].faAddress);
    }
  }, [setAllTokens]);

  // Fetch user token balances
  const { data: userBalances = new Map(), isLoading: balancesLoading, error: balancesError } = useQuery({
    queryKey: ['balances', ownerAddress, connected],
    queryFn: async () => {
      if (!connected || !ownerAddress || !aptosIndexerUrl) {
        return new Map<string, number>();
      }

      const GET_USER_TOKEN_BALANCE = `
        query GetUserTokenBalance($owner_address: String!) {
          current_fungible_asset_balances(where: {owner_address: {_eq: $owner_address}}) {
            asset_type
            amount
            metadata { decimals }
          }
        }`;

      try {
        const response = await fetch(aptosIndexerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: GET_USER_TOKEN_BALANCE, variables: { owner_address: ownerAddress } }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        const newBalances = new Map<string, number>();
        result.data.current_fungible_asset_balances.forEach((balance: any) => {
          const amount = balance.amount / (10 ** balance.metadata.decimals);
          newBalances.set(balance.asset_type, amount);
        });
        return newBalances;
      } catch (error) {
        console.error('Balance fetch error:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch balances. Please try again.',
          variant: 'destructive',
        });
        return new Map<string, number>();
      }
    },
    enabled: connected && !!ownerAddress && !!aptosIndexerUrl,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Update balances in store - FIXED: Added proper comparison to prevent infinite loops
  const previousBalancesRef = React.useRef<Map<string, number>>(new Map());

  useEffect(() => {
    // Only update if balances actually changed
    if (userBalances !== previousBalancesRef.current) {
      // Deep comparison to avoid unnecessary updates
      const hasChanged = userBalances.size !== previousBalancesRef.current.size ||
        Array.from(userBalances.entries()).some(([key, value]) =>
          previousBalancesRef.current.get(key) !== value
        );

      if (hasChanged) {
        setBalances(userBalances);
        previousBalancesRef.current = new Map(userBalances); // Create a copy
      }
    }
  }, [userBalances, setBalances]);

  // Fetch token prices for tokens with balance > 0
  const { data: tokenPrices = new Map() } = useQuery({
    queryKey: ['tokenPrices', allTokens, userBalances],
    queryFn: async () => {
      if (!allTokens.length || userBalances.size === 0) {
        return new Map<string, number>();
      }

      const tokensWithBalance = allTokens.filter(token => {
        const balance = userBalances.get(token.tokenAddress) || 0;
        return balance > 0;
      });

      if (tokensWithBalance.length === 0) {
        return new Map<string, number>();
      }

      const tokenAddresses = tokensWithBalance.map(token => token.faAddress).join(',');
      const query = { tokenAddress: tokenAddresses };
      const queryString = new URLSearchParams(query);
      const url = `${baseUrl}/prices?${queryString}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': panoraApiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const priceData = await response.json();
      const newPrices = new Map<string, number>();
      priceData.forEach((token: { faAddress: string; usdPrice: string }) => {
        // Store prices using both faAddress and tokenAddress for compatibility
        const price = parseFloat(token.usdPrice) || 0;
        newPrices.set(token.faAddress, price);

        // Also map to tokenAddress for easier lookup
        const tokenData = allTokens.find(t => t.faAddress === token.faAddress);
        if (tokenData?.tokenAddress) {
          newPrices.set(tokenData.tokenAddress, price);
        }
      });
      return newPrices;
    },
    enabled: allTokens.length > 0 && userBalances.size > 0,
    staleTime: 60000,
    refetchInterval: 120000,
  });

  // Swap mutation
  const swapMutation = useMutation({
    mutationFn: async () => {
      if (!fromAmount || !ownerAddress || fromToken === toToken || !fromToken || !toToken) {
        throw new Error('Invalid input parameters');
      }

      const fromTokenData = getTokenByAddress(fromToken);
      const balance = fromTokenData ? userBalances.get(fromTokenData.tokenAddress || fromTokenData.faAddress) || 0 : 0;
      if (!fromTokenData || parseFloat(fromAmount) > balance) {
        throw new Error(`Insufficient balance for ${getTokenSymbol(fromToken)}`);
      }

      const params = new URLSearchParams({
        chainId,
        fromTokenAddress: getTokenAddress(fromToken) as string,
        toTokenAddress: getTokenAddress(toToken) as string,
        fromTokenAmount: fromAmount,
        toWalletAddress: ownerAddress as string,
        slippagePercentage: slippage.toString(),
        integratorFeeAddress: integratorFeeAddress as string,
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

      console.log(txResponse);

      // await aptosClient(network).waitForTransaction({
      //   transactionHash: txResponse.hash,
      // });

      // console.log(txResponse);

      return txResponse;
    },
    onSuccess: (txResponse) => {
      if (txResponse.hash) {
        toast({
          title: "Success",
          description: <TransactionHash hash={txResponse.hash} network={network} />,
        });
        setFromAmount('');
        setToAmount('');
        queryClient.invalidateQueries({ queryKey: ['balances'] });
        queryClient.invalidateQueries({ queryKey: ['tokenPrices'] });
      } else {
        throw new Error('Transaction failed');
      }
    },
    onError: (error: any) => {
      const errorMessage = error.message.includes('Insufficient balance')
        ? error.message
        : 'Swap failed. Please try again.';
      toast({
        title: error.message.includes('Insufficient balance') ? 'Insufficient Balance' : 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Swap error:', error);
    },
  });

  const handleSwap = () => {
    swapMutation.mutate();
  };

  const swapTokens = () => {
    if (fromToken === toToken || !fromToken || !toToken) return;
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount('');
    setToAmount('');
  };

  const openSidebar = (type: 'from' | 'to') => {
    setSelectedTokenType(type);
    setIsSidebarOpen(true);
  };

  const selectToken = (tokenAddress: string) => {
    if (selectedTokenType === 'from') {
      setFromToken(tokenAddress);
    } else if (selectedTokenType === 'to') {
      setToToken(tokenAddress);
    }
    setIsSidebarOpen(false);
    if (selectedTokenType === 'from') {
      setFromSearch('');
    } else if (selectedTokenType === 'to') {
      setToSearch('');
    }
    setFilteredTokens(allTokens);
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
                        {[0.3, 0.5, 1].map((value) => (
                          <button
                            key={value}
                            onClick={() => setSlippage(value)}
                            className={`px-8 py-2 rounded-md text-sm font-medium transition-colors ${slippage === value
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                              }`}
                          >
                            {value}%
                          </button>
                        ))}
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
          {balancesError && (
            <div className="text-red-500 text-sm">Error fetching balances: {balancesError.message}</div>
          )}
          {balancesLoading && <div className="text-sm text-muted-foreground">Loading balances...</div>}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">From</label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    const tokenData = getTokenByAddress(fromToken);
                    const balance = tokenData ? balances.get(tokenData.tokenAddress || tokenData.faAddress) || 0 : 0;
                    if (value === '' || (parseFloat(value) > 0 && parseFloat(value) <= balance)) {
                      setFromAmount(value);
                    } else if (parseFloat(value) > balance) {
                      setFromAmount(balance.toString());
                    }
                  }}
                  className="text-lg"
                  type="number"
                  min="0"
                  max={(() => {
                    const tokenData = getTokenByAddress(fromToken);
                    return (tokenData ? balances.get(tokenData.tokenAddress || tokenData.faAddress) || 0 : 0).toString();
                  })()}
                  step="any"
                  disabled={balancesLoading || isLoading}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => openSidebar('from')}
                disabled={balancesLoading || isLoading}
                className="w-32 flex items-center justify-between"
              >
                {fromToken ? (
                  <>
                    <img
                      src={getTokenLogo(fromToken)}
                      alt={getTokenSymbol(fromToken)}
                      className="h-5 w-5 rounded-full mr-2"
                    />
                    {getTokenSymbol(fromToken)}
                  </>
                ) : 'Select Token'}
              </Button>
            </div>
            <div className="flex justify-between items-center mt-1">
              <div className="text-xs text-muted-foreground">
                Balance: {(() => {
                  const tokenData = getTokenByAddress(fromToken);
                  const balance = tokenData ? balances.get(tokenData.tokenAddress || tokenData.faAddress) || 0 : 0;
                  return balance.toFixed(2);
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
                      const tokenData = getTokenByAddress(fromToken);
                      const balance = tokenData ? balances.get(tokenData.tokenAddress || tokenData.faAddress) || 0 : 0;
                      setFromAmount((balance * percentage).toString());
                    }}
                    disabled={balancesLoading || isLoading}
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
              disabled={balancesLoading || isLoading || !fromToken || !toToken}
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
                  disabled={balancesLoading || isLoading}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => openSidebar('to')}
                disabled={balancesLoading || isLoading}
                className="w-32 flex items-center justify-between"
              >
                {toToken ? (
                  <>
                    <img
                      src={getTokenLogo(toToken)}
                      alt={getTokenSymbol(toToken)}
                      className="h-5 w-5 rounded-full mr-2"
                    />
                    {getTokenSymbol(toToken)}
                  </>
                ) : 'Select Token'}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Balance: {(() => {
                const tokenData = getTokenByAddress(toToken);
                const balance = tokenData ? balances.get(tokenData.tokenAddress || tokenData.faAddress) || 0 : 0;
                return balance.toFixed(2);
              })()}
            </div>
          </div>

          {fromAmount && quoteData.exchangeRate && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Exchange Rate</span>
                <span>1 {getTokenSymbol(fromToken)} = {quoteData.exchangeRate} {getTokenSymbol(toToken)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price Impact</span>
                <span className={quoteData.priceImpact < 1 ? 'text-green-500' : 'text-red-500'}>
                  {quoteData.priceImpact?.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network Fee</span>
                <span>~${quoteData.networkFee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Slippage Tolerance</span>
                <span>{slippage}%</span>
              </div>
            </div>
          )}

          {connected ? (
            <Button
              className="w-full vault-button"
              disabled={
                !fromAmount ||
                fromToken === toToken ||
                quoteMutation.isPending ||
                swapMutation.isPending ||
                balancesLoading ||
                !ownerAddress ||
                !fromToken ||
                !toToken
              }
              onClick={handleSwap}
            >
              {swapMutation.isPending ? 'Processing...' : !fromAmount ? 'Enter Amount' : 'Swap'}
            </Button>
          ) : (
            <ShadcnWalletSelector className="w-full vault-button" />
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        Powered by{' '}
        <a href="https://panora.exchange" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          Panora
        </a>
      </div>

      <div
        className={isSidebarOpen ? "fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end" : "hidden"}
        onClick={() => {
          setIsSidebarOpen(false);
          if (selectedTokenType === 'from') {
            setFromSearch('');
          } else if (selectedTokenType === 'to') {
            setToSearch('');
          }
          setFilteredTokens(allTokens);
          setSelectedTokenType(null);
        }}
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
                const searchValue = e.target.value;
                if (selectedTokenType === 'from') {
                  setFromSearch(searchValue);
                } else {
                  setToSearch(searchValue);
                }

                // Filter tokens based on the new search value
                if (searchValue.trim() === '') {
                  setFilteredTokens(allTokens);
                } else {
                  setFilteredTokens(allTokens.filter(
                    (token) =>
                      token.symbol.toLowerCase().includes(searchValue.toLowerCase()) ||
                      token.name.toLowerCase().includes(searchValue.toLowerCase())
                  ));
                }
              }}
              className="w-full bg-gray-800 text-white border-gray-700"
            />
            <Button
              variant="ghost"
              onClick={() => {
                setIsSidebarOpen(false);
                if (selectedTokenType === 'from') {
                  setFromSearch('');
                } else if (selectedTokenType === 'to') {
                  setToSearch('');
                }
                setFilteredTokens(allTokens);
                setSelectedTokenType(null);
              }}
              className="mt-2 text-white"
            >
              Close
            </Button>
          </div>
          <div className="p-4 space-y-2">
            {(() => {
              return filteredTokens.map((token, i) => {
                const balance = balances.get(token.tokenAddress || token.faAddress) || 0;
                const usdPrice = tokenPrices.get(token.faAddress) || tokenPrices.get(token.tokenAddress) || 0;
                const usdBalance = balance * usdPrice;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 hover:bg-gray-800 rounded cursor-pointer"
                    onClick={() => selectToken(token.tokenAddress || token.faAddress)}
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
                      <div className="text-xs text-gray-400">{usdPrice > 0 ? `$${usdBalance.toFixed(2)}` : '<$0.01'}</div>
                    </div>
                  </div>
                  // <p>{token.symbol}</p>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapPage;