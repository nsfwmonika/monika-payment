import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { SendTransactionRequest, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { TonClient } from '@ton/ton';
import axios from 'axios'

const recipientAddress = process.env.NEXT_PUBLIC_RECIPIENT_TON_WEB

interface SendProps {
  amount: string;
  tokenType: string;
  balanceSol: number;
  balanceUsdc: number;
  setBalanceSol: (balance: number) => void;
  setBalanceUsdc: (balance: number) => void;
  handleNotificationOpen: (key: string, message: string, type: 'success' | 'error' | 'warning') => void;
  onTransactionStatusTON: (status: boolean) => void;
}

const SendTon: React.FC<SendProps> = ({
  amount,
  tokenType,
  balanceSol,
  balanceUsdc,
  setBalanceSol,
  setBalanceUsdc,
  handleNotificationOpen,
  onTransactionStatusTON
}) => {
  const wallet = useTonWallet();
  const [tonConnectUi] = useTonConnectUI();
  
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [tonBalance, setTonBalance] = useState<string | null>(null);

  // const transferActivation = () => {
  //   const queryParams = new URLSearchParams(window.location.search);
  //   const sid = queryParams.get('sid') || null;

  //   const parameter = {
  //     sid,
  //     chain:'ton',
  //     wallet_address: wallet?.account.address
  //   }
  //   axios.post(process.env.NEXT_PUBLIC_WEBAPI + '/payment/active', parameter)
  //     .then(response => {
  //       console.log('transferActivation:', response)
  //     })
  //     .catch(error => {
  //       console.log(`transferActivation error: ${error.message}`)
  //     })
  // }
  const transferSuccessful = (hash: string, usd: number | string) => {
    const queryParams = new URLSearchParams(window.location.search);
    const sid = queryParams.get('sid') || null;

    let parameter = {
      sid,
      chain: 'ton',
      hash,
      usd,
      wallet_address: wallet?.account.address
    }
    axios.post(process.env.NEXT_PUBLIC_WEBAPI + '/payment', parameter)
      .then(response => {
        console.log('transferSuccessful:', response)
      })
      .catch(error => {
        console.log(`transferSuccessful error: ${error.message}`)
      })
  }

  const handleTransfer = async () => {
    // if (!wallet) {
    //   handleNotificationOpen('transaction', 'Wallet not connected!', 'warning');
    //   return;
    // }

    try {
      let tx: SendTransactionRequest;
      // transferActivation()
      if (tokenType === 'TON') {
        tx = {
          validUntil: Math.floor(Date.now() / 1000) + 600, // term of validity
          messages: [
            {
              address: recipientAddress || "",
              amount: (parseFloat(amount) * 1e9).toString(), // nanoTON
            },
          ],
        };

      }else {
        tx = {
          validUntil: Math.floor(Date.now() / 1000) + 600,
          messages: [
            {
              address: recipientAddress || "",
              amount,
              payload: `EQCK1XtDYNvczPxjCUk9cmyx7XychloCyYN3mkE5XA6i74Bx`,
            },
          ],
        };
      }
      const result = await tonConnectUi.sendTransaction(tx);
      if (result.boc) {
        const transactionHash = result.boc;
        transferSuccessful(transactionHash, amount);
      }
      handleNotificationOpen('transaction', 'Successful trade!', 'success');
      onTransactionStatusTON(true)
    } catch (error) {
      console.error('error', error);
      handleNotificationOpen('transaction', 'Transaction failed!', 'error');
      onTransactionStatusTON(false)
    }
  };

  const isDisabled = !wallet || !amount || parseFloat(amount) <= 0;
  return (
    <div className={isDisabled ? 'btn-disabled' : 'send-btn'}>
      <Button 
        onClick={handleTransfer} 
        variant="contained" 
        disabled={isDisabled}
        
        sx={{
          backgroundColor: '#fcebeb',
          width:'100%',
          height:'48px',
          color: "#000000",
          '&:disabled': {
            backgroundColor: '#cccccc',
            color: '#666666',
          }
        }}
      >
        SEND
      </Button>
    </div>
  );
};

export default SendTon;