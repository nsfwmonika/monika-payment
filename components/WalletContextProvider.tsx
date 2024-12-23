import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import * as web3 from '@solana/web3.js'
import * as walletAdapterWallets from '@solana/wallet-adapter-wallets';
require('@solana/wallet-adapter-react-ui/styles.css');

const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const rpc = process.env.NEXT_PUBLIC_RPC;
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = web3.clusterApiUrl(network)

  const wallets = useMemo(() => [
    new walletAdapterWallets.CoinbaseWalletAdapter(),
    new walletAdapterWallets.SolflareWalletAdapter(),
    new walletAdapterWallets.PhantomWalletAdapter(),

  ], []);

  return (
    <ConnectionProvider endpoint={rpc}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default WalletContextProvider