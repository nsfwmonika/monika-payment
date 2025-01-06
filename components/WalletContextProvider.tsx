import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import * as web3 from '@solana/web3.js'
import * as walletAdapterWallets from '@solana/wallet-adapter-wallets';
require('@solana/wallet-adapter-react-ui/styles.css');

const mainnetRPC = process.env.NEXT_PUBLIC_RPC_MAINNET;
const devnetRPC = process.env.NEXT_PUBLIC_RPC_DEVNET;

const DEFAULT_NETWORK = WalletAdapterNetwork.Mainnet;

const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { network, endpoint } = useMemo(() => {
    let networkFromStorage: string | null = null;
    
    if (typeof window !== 'undefined') {
      try {
        networkFromStorage = localStorage.getItem("network");
      } catch (error) {
        console.error("localStorage error:", error);
      }
    }

    const network = networkFromStorage as WalletAdapterNetwork || DEFAULT_NETWORK;
    let endpoint: string;
    
    if( networkFromStorage === "testnet") {
      endpoint = devnetRPC || ""
    }else {
      endpoint = mainnetRPC || ""
    }
    return { network, endpoint };
  }, []);

  const wallets = useMemo(() => [
    new walletAdapterWallets.CoinbaseWalletAdapter(),
    new walletAdapterWallets.SolflareWalletAdapter(),
    new walletAdapterWallets.PhantomWalletAdapter(),
  ], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default WalletContextProvider

