
import React, { useState, useEffect, useMemo } from 'react';
import { InputTransactionData, truncateAddress } from "@aptos-labs/wallet-adapter-core";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Send, Users, Save, Trash2 } from 'lucide-react';
import { aptosClient, toHexString } from '@/lib';
import { toast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { TransactionHash } from '@/components/TransactionHash';
import { WalletSelector as ShadcnWalletSelector } from '@/components/WalletSelector';
import tokens from '@/utils/tokens.json';

// Interfaces
interface TokenBalance {
  asset_type: string;
  amount: number;
  icon_uri?: string;
  metadata: { name: string; symbol: string; decimals: number; };
}

interface Contact {
  name: string;
  address: string;
}

// GraphQL Query
const GET_USER_TOKEN_BALANCE = `
  query GetUserTokenBalance($owner_address: String!) {
    current_fungible_asset_balances(where: {owner_address: {_eq: $owner_address}}) {
      asset_type
      amount
      metadata { icon_uri name symbol decimals }
    }
  }`;

const SendPage = () => {
  // Wallet and network setup
  const { account, connected, network, signAndSubmitTransaction } = useWallet();

  // Component State
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<string | undefined>();
  const [memo, setMemo] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isSending, setIsSending] = useState(false);

  const ownerAddress = account?.address && typeof account.address === 'object' && 'data' in account.address
    ? toHexString((account.address as any).data)
    : account?.address;

  const aptosIndexerUrl = network?.name.toLowerCase() === 'testnet'
    ? import.meta.env.VITE_APTOS_TESTNET_INDEXER
    : import.meta.env.VITE_APTOS_MAINNET_INDEXER;

  // Load contacts from localStorage
  useEffect(() => {
    const savedContacts = localStorage.getItem('vault-contacts');
    if (savedContacts) {
      setContacts(JSON.parse(savedContacts));
    }
  }, []);

  // Fetch balances
  const { data: balances, isLoading: balancesLoading } = useQuery<TokenBalance[]>({
    queryKey: ['fungibleAssetBalances', ownerAddress, network?.name],
    queryFn: async () => {
      if (!ownerAddress || !aptosIndexerUrl) throw new Error('Missing address or indexer URL');
      const response = await fetch(aptosIndexerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: GET_USER_TOKEN_BALANCE, variables: { owner_address: ownerAddress } }),
      });
      if (!response.ok) throw new Error('Failed to fetch balances');
      const result = await response.json();
      if (result.errors) throw new Error(result.errors[0].message);
      let balances = result.data.current_fungible_asset_balances;
      let formattedBalances = balances.map((balance: any) => {
        const tokenInfo = tokens.find((t: any) => t.faAddress === balance.asset_type || t.tokenAddress === balance.asset_type);
        return {
          ...balance,
          icon_uri: tokenInfo?.logoUrl || balance.metadata?.icon_uri || '',
        };
      });
      return formattedBalances;
    },
    enabled: !!connected && !!ownerAddress,
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  // Set default token when balances load
  useEffect(() => {
    if (!selectedToken && balances && balances.length > 0) {
      setSelectedToken(balances[0].asset_type);
    }
  }, [balances, selectedToken]);

  // Derived state
  const selectedTokenBalance = useMemo(() => {
    const token = balances?.find(b => b.asset_type === selectedToken);
    if (!token) return { amount: 0, decimals: 0 };
    return {
      amount: token.amount / (10 ** token.metadata.decimals),
      decimals: token.metadata.decimals
    };
  }, [balances, selectedToken]);

  const isRecipientSaved = useMemo(() =>
    contacts.some(c => c.address.toLowerCase() === recipient.toLowerCase()),
    [contacts, recipient]
  );

  // Handlers
  const handleSend = async () => {
    if (!recipient || !amount || !selectedToken || !balances) return;
    setIsSending(true);
    try {
      const tokenInfo = balances.find(b => b.asset_type === selectedToken);
      if (!tokenInfo) throw new Error('Selected token not found');

      const amountInSmallestUnit = Math.floor(parseFloat(amount) * (10 ** tokenInfo.metadata.decimals));

      if (amountInSmallestUnit > tokenInfo.amount) {
        throw new Error('Insufficient balance');
      }

      const transaction: InputTransactionData = {
        data: {
          function: '0x1::aptos_account::transfer_coins',
          typeArguments: [selectedToken],
          functionArguments: [recipient, amountInSmallestUnit],
        }
      };

      const result = await signAndSubmitTransaction(transaction);
      await aptosClient(network).waitForTransaction({ transactionHash: result.hash });

      toast({
        title: 'Transaction Sent!',
        description: <TransactionHash hash={result.hash} network={network} />
      });
      setAmount('');
      setRecipient('');
      setMemo('');

    } catch (error: any) {
      console.error('Send failed:', error);
      toast({ title: 'Send Failed', description: error.message || 'An unknown error occurred.', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const saveContact = (name: string, address: string) => {
    const newContacts = [...contacts, { name, address }];
    setContacts(newContacts);
    localStorage.setItem('vault-contacts', JSON.stringify(newContacts));
    toast({ title: 'Contact Saved!', description: `${name} has been added to your contacts.` });
  };

  const deleteContact = (address: string) => {
    const newContacts = contacts.filter(c => c.address !== address);
    setContacts(newContacts);
    localStorage.setItem('vault-contacts', JSON.stringify(newContacts));
    toast({ title: 'Contact Deleted' });
  };

  // Render
  // if (!connected) {
  //   return <div className="text-center p-8">Please connect your wallet to send tokens.</div>;
  // }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card className="vault-card">
        <CardHeader><CardTitle className="flex items-center space-x-2"><Send /><span>Send</span></CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>To</Label>
            <div className="flex space-x-2">
              <Input placeholder="Wallet address" value={recipient} onChange={(e) => setRecipient(e.target.value)} className="flex-1" />
              {recipient && !isRecipientSaved && <SaveContactDialog onSave={saveContact} address={recipient} />}
              <ContactsDialog contacts={contacts} onSelect={setRecipient} onDelete={deleteContact} onSave={saveContact} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input placeholder="0.0" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-lg" />
              </div>
              <Select value={selectedToken} onValueChange={setSelectedToken} disabled={balancesLoading}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Select Token" /></SelectTrigger>
                <SelectContent>
                  {balances?.map((token) => (
                    <SelectItem key={token.asset_type} value={token.asset_type}>
                      <div className="flex items-center space-x-2">
                        <img src={token.icon_uri} alt={token.metadata.symbol} className="h-5 w-5 rounded-full bg-gray-200" />
                        <span className="font-medium">{token.metadata.symbol}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Balance: {selectedTokenBalance.amount.toFixed(4)}</span>
              <Button variant="link" className="p-0 h-auto text-xs text-primary" onClick={() => setAmount(selectedTokenBalance.amount.toString())}>Max</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Memo (Optional)</Label>
            <Textarea placeholder="Add a note for this transaction" value={memo} onChange={(e) => setMemo(e.target.value)} className="resize-none" rows={2} />
          </div>

          {connected ? <Button className="w-full vault-button" disabled={!recipient || !amount || isSending || parseFloat(amount) > selectedTokenBalance.amount} onClick={handleSend}>
            {isSending ? 'Sending...' : (!recipient || !amount ? 'Enter Details' : 'Send')}
          </Button> : <ShadcnWalletSelector className="w-full vault-button" />}
        </CardContent>
      </Card>
    </div>
  );
};

// Helper Components
const SaveContactDialog = ({ address, onSave }: { address: string, onSave: (name: string, address: string) => void }) => {
  const [name, setName] = useState('');
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="outline" size="icon"><Save className="h-4 w-4" /></Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Save Contact</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label>Name / Alias</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. My Friend Bob" />
        </div>
        <div className="space-y-2">
          <Label>Address</Label>
          <Input value={address} readOnly disabled />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={() => onSave(name, address)} disabled={!name}>Save</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ContactsDialog = ({ contacts, onSelect, onDelete, onSave }: { contacts: Contact[], onSelect: (address: string) => void, onDelete: (address: string) => void, onSave: (name: string, address: string) => void }) => {
  const [newContactName, setNewContactName] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');

  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="outline" size="icon"><Users className="h-4 w-4" /></Button></DialogTrigger>
      <DialogContent className="max-h-[80vh] flex flex-col">
        <DialogHeader><DialogTitle>Contacts</DialogTitle></DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2 space-y-2">
          {contacts.length > 0 ? contacts.map(contact => (
            <div key={contact.address} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <DialogClose asChild>
                <div className="cursor-pointer flex-grow" onClick={() => onSelect(contact.address)}>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{truncateAddress(contact.address)}</p>
                </div>
              </DialogClose>
              <Button variant="ghost" size="icon" onClick={() => onDelete(contact.address)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          )) : <p className="text-sm text-muted-foreground text-center py-4">No contacts saved yet.</p>}
        </div>
        <DialogFooter className="border-t pt-4">
          <div className="flex w-full flex-col gap-2">
            <h3 className="font-medium">Add New Contact</h3>
            <Input placeholder="Name / Alias" value={newContactName} onChange={e => setNewContactName(e.target.value)} />
            <Input placeholder="Address" value={newContactAddress} onChange={e => setNewContactAddress(e.target.value)} />
            <DialogClose asChild>
              <Button onClick={() => { onSave(newContactName, newContactAddress); setNewContactName(''); setNewContactAddress(''); }} disabled={!newContactName || !newContactAddress} className="w-full">Add Contact</Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default SendPage;
