import { FC, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export const WalletConnectionManager: FC = () => {
  const { wallet, connect, disconnect } = useWallet();

  useEffect(() => {
    const savedWalletName = localStorage.getItem('connectedWallet');

    if (savedWalletName && wallet?.adapter.name === savedWalletName) {
      connect().catch(console.error);
    }

    return () => {
      if (wallet) {
        localStorage.setItem('connectedWallet', wallet.adapter.name);
      }
    };
  }, [wallet, connect]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (wallet) {
        localStorage.setItem('connectedWallet', wallet.adapter.name);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [wallet]);

  return null;
};

