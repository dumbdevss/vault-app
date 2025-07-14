
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeftRight, Settings, ArrowUpDown } from 'lucide-react';

const SwapPage = () => {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromToken, setFromToken] = useState('SUI');
  const [toToken, setToToken] = useState('USDC');

  const tokens = [
    { symbol: 'SUI', name: 'Sui', balance: '1,250.50' },
    { symbol: 'USDC', name: 'USD Coin', balance: '2,500.00' },
    { symbol: 'APT', name: 'Aptos', balance: '450.75' },
    { symbol: 'WETH', name: 'Wrapped Ethereum', balance: '0.15' },
  ];

  const swapTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card className="vault-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              <span>Swap</span>
            </div>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
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
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="text-lg"
                />
              </div>
              <Select value={fromToken} onValueChange={setFromToken}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{token.symbol}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              Balance: {tokens.find(t => t.symbol === fromToken)?.balance || '0.00'}
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={swapTokens}
              className="rounded-full border-2"
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
                  onChange={(e) => setToAmount(e.target.value)}
                  className="text-lg"
                  readOnly
                />
              </div>
              <Select value={toToken} onValueChange={setToToken}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{token.symbol}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              Balance: {tokens.find(t => t.symbol === toToken)?.balance || '0.00'}
            </div>
          </div>

          {/* Swap Details */}
          {fromAmount && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Exchange Rate</span>
                <span>1 {fromToken} = 3.08 {toToken}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price Impact</span>
                <span className="text-green-500">0.1%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network Fee</span>
                <span>~$0.02</span>
              </div>
            </div>
          )}

          {/* Swap Button */}
          <Button 
            className="w-full vault-button" 
            disabled={!fromAmount || !toAmount}
          >
            {!fromAmount ? 'Enter Amount' : 'Swap'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SwapPage;
