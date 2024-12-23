import { FC, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { WalletConnectionManager } from './WalletConnectionManager'
import { TonConnectButton } from "@tonconnect/ui-react";
import { useTelegramWebApp } from '../hooks/useTelegramWebApp'


const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export const Header: FC = () => {
  const [isInTelegram, setIsInTelegram] = useState('0');
  const isTelegramLoaded = useTelegramWebApp();

  useEffect(() => {
    setTimeout(() => {
      try {
        console.log('window:', window?.Telegram)
        if (window?.Telegram?.WebApp?.platform === 'tdesktop') {
          setIsInTelegram('1')
        } else {
          setIsInTelegram('2')
        }
      } catch (error) {
        setIsInTelegram('1')
      }
    }, 800);

  }, [isTelegramLoaded]);

  return (
    <div className="page-header">
      <WalletConnectionManager />
      <span className="logo">Monika Al</span>
      {
        isInTelegram === '1' ? <TonConnectButton className="my-button-class" /> : ''
      }
      {
        isInTelegram === '2' ?<WalletMultiButtonDynamic /> : ''
      }
    </div>
  )
}

