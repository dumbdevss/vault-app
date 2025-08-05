import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpDown, Clock, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Currency, Token, Institution, RateResponse, AccountVerificationResponse, SwapDetails } from '@/types/offramp';

const OffRampPage: React.FC = () => {
  // State management
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [tokenAmount, setTokenAmount] = useState('');
  const [fiatAmount, setFiatAmount] = useState(0);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [rate, setRate] = useState(0);
  const [timer, setTimer] = useState(15);
  const [loading, setLoading] = useState(false);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [error, setError] = useState('');
  const [institutionSearch, setInstitutionSearch] = useState('');
  const [filteredInstitutions, setFilteredInstitutions] = useState<Institution[]>([]);

  // Fetch supported currencies
  const fetchCurrencies = useCallback(async () => {
    try {
      const response = await fetch('https://api.paycrest.io/v1/currencies');
      const data = await response.json();
      if (data.status === 'success') {
        setCurrencies(data.data);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
      setError('Failed to load currencies');
    }
  }, []);

  // Fetch supported tokens for Base network
  const fetchTokens = useCallback(async () => {
    try {
      const response = await fetch('https://api.paycrest.io/v1/tokens?network=base');
      const data = await response.json();
      if (data.status === 'success') {
        setTokens(data.data);
        // Set USDC as default if available
        const usdcToken = data.data.find((token: Token) => token.symbol === 'USDC');
        if (usdcToken) {
          setSelectedToken(usdcToken);
        }
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
      setError('Failed to load tokens');
    }
  }, []);

  // Fetch institutions for selected currency
  const fetchInstitutions = useCallback(async (currencyCode: string) => {
    try {
      const response = await fetch(`https://api.paycrest.io/v1/institutions/${currencyCode}`);
      const data = await response.json();
      if (data.status === 'success') {
        setInstitutions(data.data);
      }
    } catch (error) {
      console.error('Error fetching institutions:', error);
      setError('Failed to load institutions');
    }
  }, []);

  // Fetch exchange rate
  const fetchRate = useCallback(async (token: string, amount: string, fiat: string) => {
    if (!token || !amount || !fiat || parseFloat(amount) <= 0) return;

    try {
      const response = await fetch(`https://api.paycrest.io/v1/rates/${token}/${amount}/${fiat}`);
      const data: RateResponse = await response.json();
      if (data.status === 'success') {
        const rateValue = typeof data.data === 'number' ? data.data : parseFloat(data.data);
        setRate(rateValue);
        // Update fiat amount based on the amount passed to this function
        if (amount && parseFloat(amount) > 0) {
          setFiatAmount(parseFloat(amount) * rateValue);
        }
      }
    } catch (error) {
      console.error('Error fetching rate:', error);
      setError('Failed to fetch exchange rate');
    }
  }, []);

  // Verify account number
  const verifyAccount = useCallback(async (institution: string, accountIdentifier: string) => {
    if (!institution || !accountIdentifier) return;

    setVerifyingAccount(true);
    try {
      const response = await fetch('https://api.paycrest.io/v1/verify-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institution, accountIdentifier })
      });
      const data: AccountVerificationResponse = await response.json();
      if (data.status === 'success') {
        setAccountName(data.data);
        setError('');
      } else {
        setError('Account verification failed');
        setAccountName('');
      }
    } catch (error) {
      console.error('Error verifying account:', error);
      setError('Failed to verify account');
      setAccountName('');
    } finally {
      setVerifyingAccount(false);
    }
  }, []);

  // Timer for rate refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          // Refresh rate only when all conditions are met
          if (selectedToken && selectedCurrency && tokenAmount && parseFloat(tokenAmount) > 0) {
            fetchRate(selectedToken.symbol, tokenAmount, selectedCurrency.code);
          }
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedToken, tokenAmount, selectedCurrency, fetchRate]);

  // Initial data fetch
  useEffect(() => {
    fetchCurrencies();
    fetchTokens();
  }, [fetchCurrencies, fetchTokens]);

  // Fetch institutions when currency changes
  useEffect(() => {
    if (selectedCurrency) {
      fetchInstitutions(selectedCurrency.code);
    }
  }, [selectedCurrency, fetchInstitutions]);

  // Filter institutions based on search
  useEffect(() => {
    if (institutionSearch.trim() === '') {
      setFilteredInstitutions(institutions);
    } else {
      setFilteredInstitutions(
        institutions.filter(institution =>
          institution.name.toLowerCase().includes(institutionSearch.toLowerCase())
        )
      );
    }
  }, [institutions, institutionSearch]);



  // Fetch rate when inputs change - only when both token and currency are selected
  useEffect(() => {
    if (selectedToken && selectedCurrency && tokenAmount && parseFloat(tokenAmount) > 0) {
      const debounceTimer = setTimeout(() => {
        fetchRate(selectedToken.symbol, tokenAmount, selectedCurrency.code);
      }, 500);
      return () => clearTimeout(debounceTimer);
    } else {
      // Reset rate and fiat amount when conditions aren't met
      setRate(0);
      setFiatAmount(0);
    }
  }, [selectedToken, tokenAmount, selectedCurrency, fetchRate]);

  // Verify account when inputs change
  useEffect(() => {
    if (selectedInstitution && accountNumber.length >= 10) {
      const debounceTimer = setTimeout(() => {
        verifyAccount(selectedInstitution.code, accountNumber);
      }, 1000);
      return () => clearTimeout(debounceTimer);
    } else {
      setAccountName('');
    }
  }, [selectedInstitution, accountNumber, verifyAccount]);

  const handleSwap = () => {
    if (!selectedToken || !selectedCurrency || !selectedInstitution || !accountNumber || !accountName || !tokenAmount) {
      setError('Please fill in all required fields');
      return;
    }
    setShowReview(true);
  };

  const handleConfirmSwap = () => {
    // Here you would implement the actual swap logic
    console.log('Confirming swap...');
    // Reset form or navigate to success page
  };

  const getTokenIcon = (symbol: string) => {
    return `/off_ramp/${symbol.toLowerCase()}.jpg`;
  };

  const getCurrencyIcon = (code: string) => {
    return `/off_ramp/${code.toLowerCase()}.jpg`;
  };

  if (showReview) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Card className="vault-card">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowReview(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <CardTitle>Review Transaction</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="text-3xl font-bold">
                {tokenAmount} {selectedToken?.symbol}
              </div>
              <ArrowUpDown className="h-6 w-6 text-muted-foreground mx-auto" />
              <div className="text-3xl font-bold text-primary">
                {selectedCurrency?.symbol}{fiatAmount.toFixed(2)}
              </div>
            </div>

            <div className="space-y-4 bg-secondary p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network:</span>
                <span className="capitalize">{selectedToken?.network}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token:</span>
                <span>{selectedToken?.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency:</span>
                <span>{selectedCurrency?.shortName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate:</span>
                <span>1 {selectedToken?.symbol} = {selectedCurrency?.symbol}{typeof rate === 'number' ? rate.toFixed(2) : rate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Institution:</span>
                <span>{selectedInstitution?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account:</span>
                <span>{accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Name:</span>
                <span>{accountName}</span>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
              <p className="text-yellow-200 text-sm">
                Please review all information carefully before proceeding. This transaction cannot be reversed once confirmed.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowReview(false)}
              >
                Go Back
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleConfirmSwap}
              >
                Confirm Swap
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card className="vault-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Off-Ramp
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Rate updates in {timer}s</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          {/* Token Input Section */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Send</label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={tokenAmount}
                  onChange={(e) => {
                    setTokenAmount(e.target.value);
                    // Only calculate fiat amount if we have a valid rate
                    if (rate > 0 && e.target.value) {
                      setFiatAmount(parseFloat(e.target.value) * rate);
                    } else {
                      setFiatAmount(0);
                    }
                  }}
                  className="text-lg"
                  min="0"
                  step="any"
                />
              </div>
              <Select value={selectedToken?.symbol || ''} onValueChange={(value) => {
                const token = tokens.find(t => t.symbol === value);
                setSelectedToken(token || null);
              }}>
                <SelectTrigger className="w-32 flex items-center justify-between">
                  <SelectValue>
                    {selectedToken ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={getTokenIcon(selectedToken.symbol)}
                          alt={selectedToken.symbol}
                          className="h-5 w-5 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        {selectedToken.symbol}
                      </div>
                    ) : 'Select Token'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center gap-2">
                        <img
                          src={getTokenIcon(token.symbol)}
                          alt={token.symbol}
                          className="w-5 h-5 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <span>{token.symbol}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-2"
              disabled
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Currency Output Section */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Receive</label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  placeholder="0.0"
                  value={fiatAmount > 0 ? fiatAmount.toFixed(2) : ''}
                  className="text-lg"
                />
              </div>
              <Select value={selectedCurrency?.code || ''} onValueChange={(value) => {
                const currency = currencies.find(c => c.code === value);
                setSelectedCurrency(currency || null);
              }}>
                <SelectTrigger className="w-48 flex items-center justify-between">
                  <SelectValue placeholder="Select currency">
                    {selectedCurrency ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={getCurrencyIcon(selectedCurrency.code)}
                          alt={selectedCurrency.code}
                          className="h-5 w-5 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        {selectedCurrency.shortName}
                      </div>
                    ) : 'Select currency'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center gap-2">
                        <img
                          src={getCurrencyIcon(currency.code)}
                          alt={currency.code}
                          className="w-5 h-5 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <span>{currency.shortName} ({currency.code})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rate Display */}
          {/* {rate > 0 && selectedToken && selectedCurrency && (
            <div className="bg-secondary p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Exchange Rate</span>
                <span className="font-medium">
                  1 {selectedToken.symbol} = {selectedCurrency.symbol}{rate}
                </span>
              </div>
            </div>
          )} */}

          {/* Institution Selection */}
          {selectedToken && selectedCurrency && tokenAmount && parseFloat(tokenAmount) > 0 && institutions.length > 0 && (
            <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-300">
              <label className="text-sm text-muted-foreground">Select Institution</label>
              <div className="space-y-2">
                {!selectedInstitution && <Input
                  placeholder="Search banks and institutions..."
                  value={institutionSearch}
                  onChange={(e) => setInstitutionSearch(e.target.value)}
                  className="w-full"
                />}
                {selectedInstitution ? (
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <span className="font-medium">{selectedInstitution.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedInstitution(null);
                        setAccountNumber('');
                        setAccountName('');
                        setInstitutionSearch('');
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredInstitutions.length > 0 ? (
                      filteredInstitutions.map((institution) => (
                        <button
                          key={institution.code}
                          onClick={() => {
                            setSelectedInstitution(institution);
                            setAccountNumber('');
                            setAccountName('');
                            setInstitutionSearch('');
                          }}
                          className="w-full text-left p-3 rounded-lg hover:bg-secondary transition-colors"
                        >
                          {institution.name}
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted-foreground text-sm">
                        No institutions found matching "{institutionSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Number Input */}
          {selectedInstitution && (
            <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-300">
              <label className="text-sm text-muted-foreground">Account Number</label>
              <Input
                type="text"
                placeholder="Enter your account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
              {verifyingAccount && (
                <div className="text-muted-foreground text-sm">Verifying account...</div>
              )}
              {accountName && (
                <div className="text-primary capitalize text-sm font-medium">
                  ✓ {accountName.toLowerCase()}
                </div>
              )}
            </div>
          )}
    
          {/* Transaction Description */}
          {/* {accountName && (
            <div className="bg-secondary p-4 rounded-lg space-y-2 animate-in slide-in-from-bottom-4 duration-300">
              <h4 className="font-medium">Transaction Summary</h4>
              <p className="text-muted-foreground text-sm">
                You will send {tokenAmount || '0'} {selectedToken?.symbol} from the {selectedToken?.network} network
                and receive {selectedCurrency?.symbol}{fiatAmount.toFixed(2)} in your {selectedInstitution?.name} account.
              </p>
            </div>
          )} */}

          {/* Swap Button */}
          <Button
            onClick={handleSwap}
            disabled={!selectedToken || !selectedCurrency || !selectedInstitution || !accountNumber || !accountName || !tokenAmount || parseFloat(tokenAmount) <= 0}
            className="w-full h-12 text-lg font-medium"
          >
            {loading ? 'Processing...' : 'Swap'}
          </Button>
        </CardContent>

        {/* Rate Information Footer */}
        {rate > 0 && selectedToken && selectedCurrency && (
          <div className="px-6 pb-4">
            <div className="bg-secondary/50 p-4 rounded-lg border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">
                    1 {selectedToken.symbol} ≈ {selectedCurrency.symbol}{typeof rate === 'number' ? rate.toFixed(2) : rate}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Updates in {timer}s</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Rate includes network fees • Best price guaranteed
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OffRampPage;
