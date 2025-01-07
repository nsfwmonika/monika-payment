import { NextPage } from 'next'
import WalletContextProvider from '../components/WalletContextProvider'
import { Header } from '../components/Header'
import { MainDisplay } from '../components/MainDisplay'
import Head from 'next/head'
import { THEME, TonConnectUIProvider } from "@tonconnect/ui-react";
import RemoteJS from 'remotejs';

const Home: NextPage = (props) => {
  return (
    <div >
      <Head>
        <title>Monika Al</title>
        <meta
          name="description"
          content="Wallet-Adapter Example"
        />
      </Head>
      <TonConnectUIProvider
        manifestUrl="https://ton-connect.github.io/demo-dapp-with-wallet/tonconnect-manifest.json"
        uiPreferences={{ theme: THEME.DARK }}
        walletsListConfiguration={{
          includeWallets: [
            {
              appName: "safepalwallet",
              name: "SafePal",
              imageUrl: "https://s.pvcliping.com/web/public_image/SafePal_x288.png",
              aboutUrl: "https://www.safepal.com/download",
              jsBridgeKey: "safepalwallet",
              platforms: ["ios", "android", "chrome", "firefox"]
            },
            {
              appName: "tonwallet",
              name: "TON Wallet",
              imageUrl: "https://wallet.ton.org/assets/ui/qr-logo.png",
              aboutUrl: "https://chrome.google.com/webstore/detail/ton-wallet/nphplpgoakhhjchkkhmiggakijnkhfnd",
              universalLink: "https://wallet.ton.org/ton-connect",
              jsBridgeKey: "tonwallet",
              bridgeUrl: "https://bridge.tonapi.io/bridge",
              platforms: ["chrome", "android"]
            }
          ]
        }}
        actionsConfiguration={{
          twaReturnUrl: 'https://t.me/tc_twa_demo_bot/start'
        }}
      >
        <WalletContextProvider>
          <Header />
          <MainDisplay />
        </WalletContextProvider >
      </TonConnectUIProvider>
    </div>
  );
}

export default Home;