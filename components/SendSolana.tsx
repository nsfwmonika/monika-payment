import React, { useState, useEffect } from 'react';
import LoadingButton from '@mui/lab/LoadingButton';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as web3 from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';

import axios from 'axios'

interface SendProps {
  loadingSol: boolean;
  amount: string;
  usd: string;
  tokenType: string;
  balanceSol: number;
  balanceUsdc: number;
  setBalanceSol: (balance: number | number) => void;
  setBalanceUsdc: (balance: number | number) => void;
  handleNotificationOpen: (key: string, message: string, type: 'success' | 'error' | 'warning') => void;
  onTransactionStatusSOLANA: (status: boolean) => void;
}

const SendSolana: React.FC<SendProps> = ({
  loadingSol,
  amount,
  usd,
  tokenType,
  balanceSol,
  balanceUsdc,
  setBalanceSol,
  setBalanceUsdc,
  handleNotificationOpen,
  onTransactionStatusSOLANA
}) => {
  const USDC_MINT = new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT || '');
  const recipientAddress = process.env.NEXT_PUBLIC_RECIPIENT_SOLANA;

  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [loading, setLoading] = useState(loadingSol);

  useEffect(() => {
    setLoading(loadingSol)
  }, [loadingSol]);


  const detectSolanaNetwork = () => {
    const connection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'), 'confirmed');
    return connection.rpcEndpoint.includes('mainnet-beta');
  }

  const transferSuccessful = (chain: string, hash: string,) => {
    const walletAddress = publicKey?.toBase58() || '';
    const queryParams = new URLSearchParams(window.location.search);
    const sid = queryParams.get('sid') || null;

    let parameter = {
      sid,
      chain,
      wallet_address: walletAddress,
      hash,
      usd
    }
    axios.post(process.env.NEXT_PUBLIC_WEBAPI + '/payment', parameter)
      .then(response => {
        console.log('transferSuccessful:', response)
      })
      .catch(error => {
        console.log(`transferSuccessful error: ${error.message}`)
      })
  }
  const upBalanceSOL = async () => {
    if (!publicKey) {
      console.error('Public key is null');
      return;
    }

    try {
      const tempBalance = await connection.getBalance(publicKey);
      setBalanceSol(tempBalance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalanceSol(0);
    }
  };
  const handleTransfer = async () => {
    if (!publicKey) {
      handleNotificationOpen('transaction', 'Wallet not connected!', 'error');
      return;
    }

    try {
      let transaction = new Transaction();
      setLoading(true)
      if (!recipientAddress) {
        return;
      }

      if (detectSolanaNetwork()) {
        if (tokenType === 'SOL') {
          const transaction = new web3.Transaction();
          const recipientPubKey = new web3.PublicKey(recipientAddress);
          const sendSolInstruction = web3.SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: recipientPubKey,
            lamports: BigInt(Math.floor(Number(amount) * LAMPORTS_PER_SOL))
          });
          transaction.add(sendSolInstruction);

          upBalanceSOL();

          sendTransaction(transaction, connection).then(async (sig) => {
            setLoading(false)
            console.log('SOL Transaction Hash:', Number(amount), sig);
            handleNotificationOpen('transaction', 'Successful trade!', 'success');
            onTransactionStatusSOLANA(true)
            transferSuccessful('solana', sig)
          }).catch(error => {

            setLoading(false)
          });
        }

        if (balanceUsdc > 0) {
          if (tokenType === 'USDC') {
            try {
              const fromTokenAccount = await getAssociatedTokenAddress(
                USDC_MINT,
                publicKey
              );
              const toTokenAccount = await getAssociatedTokenAddress(
                USDC_MINT,
                new PublicKey(recipientAddress)
              );
              const transferInstruction = createTransferInstruction(
                fromTokenAccount,
                toTokenAccount,
                publicKey,
                BigInt(Math.floor(Number(amount) * 1e6))
              );
              setLoading(false)
              transaction.add(transferInstruction);

              sendTransaction(transaction, connection).then((sig) => {
                handleNotificationOpen('transaction', 'Successful trade!', 'success');
                onTransactionStatusSOLANA(true)
                transferSuccessful('solana', sig)

               setLoading(true)
                const updateUsdcBalance = async () => {
                  try {
                    const tokenAccounts = await connection.getTokenAccountsByOwner(
                      publicKey,
                      { mint: USDC_MINT }
                    );
                    if (tokenAccounts.value.length > 0) {
                      const usdcAccountInfo = await connection.getParsedAccountInfo(tokenAccounts.value[0].pubkey);
                      if (usdcAccountInfo.value) {
                        const parsedInfo = usdcAccountInfo.value.data as any;
                        const usdcBalance = parsedInfo.parsed.info.tokenAmount.uiAmount;
                        setBalanceUsdc(usdcBalance);
                        setLoading(false)
                      }
                    }
                  } catch (error) {
                    setLoading(false)

                    console.error('Failed to update USDC balance:', error);
                  }
                };
                updateUsdcBalance();
              });

            } catch (error) {
              console.log('error----', error)
            }
          }
        }
      } else {
        handleNotificationOpen('transaction', 'Unsupported network. Please connect to Ethereum or Solana!', 'warning');
        onTransactionStatusSOLANA(false)
        setLoading(false)
        return;
      }
    } catch (error) {
      setLoading(false)
      console.error('Transaction error:', error);
      handleNotificationOpen('transaction', 'User canceled request!', 'error');
      onTransactionStatusSOLANA(false)
    }
  }

  const isDisabled = !(balanceSol && Number(amount) > 0);

  return (
    <div className={isDisabled ? 'btn-disabled' : 'send-btn'}>
      <LoadingButton
        disabled={isDisabled}
        loading={loading}
        variant="contained"
        onClick={handleTransfer}
      >
        Send
      </LoadingButton>
    </div>
  );
};

export default SendSolana;

