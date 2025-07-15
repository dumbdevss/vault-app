import React from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

const ConnectWalletButton = () => {
  return (
    <Button className="vault-button flex items-center space-x-2">
      <Wallet className="h-4 w-4" />
      <span>Connect Wallet</span>
    </Button>
  );
};

export default ConnectWalletButton;
