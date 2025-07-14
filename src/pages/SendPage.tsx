
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Send, Scan, Users } from 'lucide-react';

const SendPage = () => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('SUI');
  const [memo, setMemo] = useState('');

  const tokens = [
    { symbol: 'SUI', name: 'Sui', balance: '1,250.50' },
    { symbol: 'USDC', name: 'USD Coin', balance: '2,500.00' },
    { symbol: 'APT', name: 'Aptos', balance: '450.75' },
    { symbol: 'WETH', name: 'Wrapped Ethereum', balance: '0.15' },
  ];

  const recentContacts = [
    { name: 'Alice', address: '0x1234...5678', lastSent: '2 days ago' },
    { name: 'Bob', address: '0xabcd...efgh', lastSent: '1 week ago' },
    { name: 'Charlie', address: '0x9876...5432', lastSent: '2 weeks ago' },
  ];

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card className="vault-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5 text-primary" />
            <span>Send</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recipient */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">To</label>
            <div className="flex space-x-2">
              <Input
                placeholder="Wallet address or ENS name"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="icon">
                <Scan className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Users className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Amount and Token Selection */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Amount</label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg"
                />
              </div>
              <Select value={selectedToken} onValueChange={setSelectedToken}>
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
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Balance: {tokens.find(t => t.symbol === selectedToken)?.balance || '0.00'}</span>
              <Button variant="link" className="p-0 h-auto text-xs text-primary">
                Max
              </Button>
            </div>
          </div>

          {/* Memo */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Memo (Optional)</label>
            <Textarea
              placeholder="Add a note for this transaction"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Transaction Details */}
          {amount && recipient && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network Fee</span>
                <span>~$0.02</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">{amount} {selectedToken}</span>
              </div>
            </div>
          )}

          {/* Send Button */}
          <Button 
            className="w-full vault-button" 
            disabled={!recipient || !amount}
          >
            {!recipient || !amount ? 'Enter Details' : 'Send'}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Contacts */}
      <Card className="vault-card">
        <CardHeader>
          <CardTitle className="text-lg">Recent Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentContacts.map((contact, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => setRecipient(contact.address)}
              >
                <div>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-muted-foreground">{contact.address}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {contact.lastSent}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SendPage;
