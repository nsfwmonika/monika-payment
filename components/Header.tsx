import { FC, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { WalletConnectionManager } from './WalletConnectionManager'
import { TonConnectButton } from "@tonconnect/ui-react"
import { useTelegramWebApp } from '../hooks/useTelegramWebApp'
import { Button, Select, MenuItem, FormControl, SelectChangeEvent } from '@mui/material'

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
)

type NetworkType = 'mainnet' | 'testnet'

export const Header: FC = () => {
  const [isInTelegram, setIsInTelegram] = useState('0')
  const [network, setNetwork] = useState<NetworkType>('mainnet')
  const isTelegramLoaded = useTelegramWebApp()

  useEffect(() => {
    const savedNetwork = localStorage.getItem('network') as NetworkType
    if (savedNetwork) {
      setNetwork(savedNetwork)
    }
  }, [])

  useEffect(() => {
    try {
      const currentPath = window.location;
      if (currentPath.href.indexOf("solana") === -1) {
        setIsInTelegram('1')
      } else {
        setIsInTelegram('2')
      }
    } catch (error) {
      setIsInTelegram('1')
    }
  }, [isTelegramLoaded])

  const handleNetworkChange = (event: SelectChangeEvent<NetworkType>) => {
    const newNetwork = event.target.value as NetworkType
    setNetwork(newNetwork)
    localStorage.setItem('network', newNetwork)
    window.location.reload()
  }

  return (
    <div className="page-header">
      <WalletConnectionManager />
      <span className="logo" style={{
      }}>Monika Al</span>
      <div className="flex items-center gap-4">

        {/* <FormControl size="small" sx={{ minWidth: 106 }}>
          <Select
            value={network}
            onChange={handleNetworkChange}
            sx={{
              marginRight: "12px",
              backgroundColor: '#303542',
              border: "1px solid #4e4e4e",
              color: "#ffffff",
              borderRadius: "24px",
              '& .MuiSelect-select': {
                padding: '8px 10px',
                paddingRight:"2px !important",
                fontSize:"14px"
              }
            }}
          >
            <MenuItem value="mainnet">Mainnet</MenuItem>
            <MenuItem value="testnet">Devnet</MenuItem>
          </Select>
        </FormControl> */}
        {isInTelegram === '1' && <TonConnectButton className="my-button-class" />}
        {isInTelegram === '2' && <WalletMultiButtonDynamic />}
      </div>
    </div>
  )
}

