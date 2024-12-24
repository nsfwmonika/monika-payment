/* eslint-disable @next/next/no-img-element */
import { FC, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL, Connection, clusterApiUrl } from '@solana/web3.js';
import { useTonWallet } from "@tonconnect/ui-react";
import { TonClient, Address } from '@ton/ton';
import Link from "next/link";
import { fetchSolSwapResponse, transferActivation } from '../utils/utils';
import { Box, TextField, Select, MenuItem, Dialog, DialogTitle, DialogContentText, DialogContent, DialogActions, Button } from '@mui/material';

import SendSolana from './SendSolana';
import SendTon from './SendTon';
import UnitSelector from './UnitSelector';
import Notification from './Notification';

type SeverityType = 'success' | 'info' | 'warning' | 'error';

export const MainDisplay: FC = () => {
    const timerRef = useRef<NodeJS.Timeout>();
    const USDC_MINT = useMemo(() => new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT), []);
    const tokenOptions = [{
        value: 'SOL',
        label: 'SOL',
        icon: '/assets/solana.png'
    },
    {
        value: 'USDC',
        label: 'USDC',
        icon: '/assets/usdc.png'
    }]

    const tokenOptionsTON = [
        {
            value: 'TON',
            label: 'TON',
            icon: '/assets/ton.png'
        },
        // {
        //     value: 'USDT',
        //     label: 'USDT',
        //     icon: '/assets/usdt.png'
        // }
    ]

    const [notificationOpen, setNotificationOpen] = useState({
        transaction: false,
        second: false,
        third: false,
    });

    const walletTon = useTonWallet();
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [tonBalance, setTonBalance] = useState<string | null>(null);
    const [usdtBalance, setUsdtBalance] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    const [chainType, setChainType] = useState('solana');
    const [severityType, setSeverity] = useState<SeverityType>('info');
    const [messages, setMessages] = useState('');

    const [balanceSol, setSolBalance] = useState(0);
    const [balanceUsdc, setUsdcBalance] = useState(0);
    const { connection } = useConnection();
    const { publicKey } = useWallet();


    const [loadingSol, setLoadingSol] = useState(false);
    const [amount, setAmount] = useState<string>('');
    const [tokenAmount, setTokenAmoun] = useState<string>('');
    const [customAmount, setCustomAmount] = useState<string>('');

    const [tokenType, setTokenType] = useState('SOL');

    const [isInspect, setIsInspect] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

    const handleClose = () => {
        setOpen(false);
    };


    useEffect(() => {
        // console.log('Ton wallet info:', walletTon);
        setTokenType(walletTon ? 'TON' : 'SOL')
        setChainType(walletTon ? 'ton' : 'solana')
        if (walletTon) {
            setWalletAddress(walletTon.account.address);
            fetchTonBalance(walletTon.account.address);
        } else {
            setWalletAddress(null);
            setTonBalance(null);
        }
    }, [walletTon]);

    const fetchTonBalance = async (address: string) => {
        try {
            const client = new TonClient({
                endpoint: 'https://toncenter.com/api/v2/jsonRPC',
            });
            const balance = await client.getBalance(Address.parse(address));
            let val = (Number(balance) / 1e9).toFixed(2)
            setTonBalance(val); // Convert from nanoTON to TON
        } catch (error) {
            console.error('Error fetching TON balance:', error);
            setTonBalance(null);
        }

        // try {
        //     const client = new TonClient({
        //         endpoint: 'https://toncenter.com/api/v2/jsonRPC',
        //     });
        //     const usdtContract = client.open(Address.parse(USDT_CONTRACT_ADDRESS));
        //     const result = await usdtContract.runMethod('get_wallet_data', [Address.parse(address)]);

        //     if (result.stack.items.length > 0) {
        //         const balance = result.stack.items[0];
        //         let val = (Number(balance) / 1e6).toFixed(2)
        //         setUsdtBalance(val);
        //     } else {
        //         setUsdtBalance('0.00');
        //     }
        // } catch (error) {
        //     setUsdtBalance(null);
        // }
    };
    const onTransactionStatusTON = (status: boolean) => {
        fetchTonBalance(walletAddress)
    }


    const fetchBalanceSOLANA = useCallback(async () => {
        try {
            const walletBalance = await connection.getBalance(publicKey);
            setSolBalance(walletBalance / LAMPORTS_PER_SOL);
        } catch (error) {
            console.error('Failed to fetch balance SOL:', error);
            setSolBalance(0);
        }

        try {
            const usdcTokenAccounts = await connection.getTokenAccountsByOwner(publicKey, { mint: USDC_MINT });
            if (usdcTokenAccounts.value.length > 0) {
                const usdcAccount = usdcTokenAccounts.value[0].pubkey;
                const usdcBalance = await connection.getTokenAccountBalance(usdcAccount);
                setUsdcBalance(Number(usdcBalance.value.uiAmount));
            } else {
                setUsdcBalance(0);
            }

        } catch (error) {
            console.error('Failed to fetch balance USDC:', error);
            setUsdcBalance(0);
        }
    }, [connection, publicKey, USDC_MINT]);

    const onTransactionStatusSOLANA = (status: boolean) => {
        // if (status) {
        //     setAmount('')
        //     setCustomAmount('')
        // }
        fetchBalanceSOLANA()
    }


    const activation = async (chain, walletAddress) => {
        try {
            const result = await transferActivation({
                chain,
                walletAddress
            });
            setOpen(result?.data?.code === 200 ? false : true);
        } catch (error) {
            console.error('activation error:', error);
            setOpen(true);
        }
    }
    useEffect(() => {
        if (!connection || !publicKey) {
            setSolBalance(0);
            setLoadingSol(false)
            return;
        }

        if (publicKey) {
            activation('sol', publicKey?.toBase58() || '')
        }

        const isConnection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
        if (!isConnection.rpcEndpoint.includes('mainnet-beta')) {
            handleNotificationOpen('transaction', 'Unsupported network. Please connect to Ethereum or Solana!', 'warning');
            setIsInspect(true);
            return;
        } else {
            setIsInspect(false);
        }

        fetchBalanceSOLANA();
        // // const balanceIntervalId = setInterval(fetchBalanceSOLANA, 10000);
        // return () => {
        //     // clearInterval(balanceIntervalId);
        // };
    }, [connection, publicKey, fetchBalanceSOLANA]);

    const handleChange = async (value: string) => {
        setAmount('')
        setTokenType(value);
        if (chainType === 'solana') {
            if (value === 'USDC') {
                setAmount(customAmount)
            } else {
                setLoadingSol(true)
                const swapAmount = await fetchSolSwapResponse(+customAmount);
                if (swapAmount !== null) {
                    setAmount(String(swapAmount));
                }
                setLoadingSol(false)
            }
        }
    }

    const handleNotificationOpen = (key: string, message: string, type: 'success' | 'error' | 'warning') => {
        setMessages(message);
        setSeverity(type);
        setNotificationOpen((prev) => ({ ...prev, [key]: true }));
    };

    const handleNotificationClose = (key: string) => (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setNotificationOpen((prev) => ({ ...prev, [key]: false }));
    };

    const handleUnitSelect = async (unit: string) => {
        setSelectedUnit(unit);
        setAmount('')
        let val = parseFloat(unit.replace('U', ''));
        setCustomAmount(String(val))
        if (chainType === 'solana') {
            if (tokenType !== 'SOL') {
                setAmount(String(val));
            } else {
                setLoadingSol(true)
                const swapAmount = await fetchSolSwapResponse(val);
                if (swapAmount !== null) {
                    setAmount(String(swapAmount));
                }

                setLoadingSol(false)
            }
        } else {
            setAmount(String(val));
        }
    };

    const debouncedAmount = useCallback((value: string, type: string) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            debouncedAmountSend(value, type);
        }, 500);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // customAmount
    const debouncedAmountSend = async (value: string, type: string) => {
        setAmount("")
        let tempAmount = value?.indexOf('U') !== -1 ? parseFloat(value.replace('U', '')) : +value

        if (chainType === 'solana' && tempAmount>0) {
            if (type === 'SOL') {
                setLoadingSol(true)
                const swapAmount = await fetchSolSwapResponse(tempAmount);
                setAmount(String(swapAmount))
                setLoadingSol(false)
            } else {
                setAmount(String(tempAmount))

            }
        }
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCustomAmount(event.target.value)
        setSelectedUnit(null);
        debouncedAmount(event.target.value, tokenType)
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === '.' || e.key === ',') {
            e.preventDefault();
            return;
        }
        if (e.key === 'Backspace' || e.key === 'Delete') {
            return;
        }
        if (
            !/^\d$/.test(e.key) &&
            !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)
        ) {
            e.preventDefault();
        }
    };
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pastedData = e.clipboardData.getData('text');
        if (!(/^[1-9]\d*$/.test(pastedData))) {
            e.preventDefault();
        }
    };
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    return (
        <div className='sol-main'>
            <Notification
                open={notificationOpen.transaction}
                onClose={handleNotificationClose('transaction')}
                message={messages}
                severity={severityType}
            />
            <div className='send-main'>
                <p className="title">Send</p>
                {
                    chainType === 'solana' ?
                        <div>
                            <div className="lable">
                                <span>Level</span>
                            </div>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: 2 }}>
                                <UnitSelector
                                    selectedUnit={selectedUnit}
                                    onUnitSelect={handleUnitSelect}
                                    disabled={false}
                                />
                            </Box>
                        </div> : ''
                }
                <div className="gr-item">
                    <div className="lable">
                        <span>Custom Quantity</span>
                    </div>
                    <div className='input'>
                        <TextField
                            value={customAmount}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            onPaste={handlePaste}
                            variant="outlined"
                            placeholder="0"
                            autoComplete="off"
                            sx={{
                                marginTop: '8px',
                                width: '100%',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    background: '#121214',
                                    '& fieldset': {
                                        borderColor: '#4e4e4e',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#da842d',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#da842d',
                                    },
                                    '& input': {
                                        textAlign: 'left',
                                        color: '#ffffff',
                                    },
                                    '& input::placeholder': {
                                        color: '#bfbfc3',
                                        opacity: 0.7,
                                    },
                                },
                            }}
                        />
                    </div>
                </div>

                <div className='gr-item'>
                    <div className="lable">
                        <span>Token</span>
                        <div>Balance:
                            {
                                chainType === 'solana' ?
                                    <span className='max-value'>
                                        {tokenType === 'SOL' ? balanceSol : balanceUsdc}
                                    </span>
                                    : <span className='max-value'>
                                        {tokenType === 'TON' ? tonBalance : usdtBalance}
                                    </span>
                            }
                        </div>
                    </div>
                    <div className='groud-select'>
                        <Select
                            value={tokenType}
                            onChange={(event) => handleChange(event.target.value as string)}
                            sx={{
                                width: 120,
                                height: 40,
                                backgroundColor: '#212121',
                                color: 'white',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#212121',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'transparent',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#212121',
                                },
                                '& .MuiSelect-icon': {
                                    color: 'white',
                                },
                            }}
                        >
                            {
                                chainType === 'ton' ?
                                    tokenOptionsTON.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <img
                                                    src={option.icon}
                                                    alt={option.label}
                                                    width={26}
                                                    height={26}
                                                    className="token-logo"
                                                    style={{ borderRadius: '50%' }}
                                                />
                                                <span style={{ marginLeft: '10px' }}>{option.label}</span>
                                            </div>
                                        </MenuItem>
                                    )) :

                                    tokenOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <img
                                                    src={option.icon}
                                                    alt={option.label}
                                                    width={26}
                                                    height={26}
                                                    className="token-logo"
                                                    style={{ borderRadius: '50%' }}
                                                />
                                                <span style={{ marginLeft: '10px' }}>{option.label}</span>
                                            </div>
                                        </MenuItem>
                                    ))
                            }
                        </Select>
                        <div style={{
                            flex: "1",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end"
                        }}>
                            <div style={{
                                color: '#ffffff'
                            }}>
                                {amount}
                            </div>
                        </div>
                    </div>
                </div>

                <div className='send'>
                    {
                        chainType === 'solana' ?
                            <SendSolana
                                loadingSol={loadingSol}
                                amount={amount}
                                usd={customAmount}
                                tokenType={tokenType}
                                balanceSol={balanceSol}
                                balanceUsdc={balanceUsdc}
                                setBalanceSol={setSolBalance}
                                setBalanceUsdc={setUsdcBalance}
                                handleNotificationOpen={handleNotificationOpen}
                                onTransactionStatusSOLANA={onTransactionStatusSOLANA}
                            /> : <SendTon amount={amount}
                                tokenType={tokenType}
                                balanceSol={balanceSol}
                                balanceUsdc={balanceUsdc}
                                setBalanceSol={setSolBalance}
                                setBalanceUsdc={setUsdcBalance}
                                handleNotificationOpen={handleNotificationOpen}
                                onTransactionStatusTON={onTransactionStatusTON}
                            />
                    }
                </div>

            </div>

            <Dialog
                open={open}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                PaperProps={{
                    sx: {
                        paddingBottom: '24px',
                    }
                }}
            >
                <DialogTitle id="alert-dialog-title">
                    {"Access Restricted:"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Secure access available through Telegram: Connect with Monika Bot.
                    </DialogContentText>

                </DialogContent>
                <DialogActions
                    sx={{
                        display: "flex",
                        justifyContent: "center"
                    }}>
                    <Link
                        href="https://t.me/nsfwmonika_bot"
                    >
                        <a target="_blank" rel="noopener noreferrer">
                            <Button sx={{
                                width: '180px',
                                borderRadius: '24px',
                                color: '#000000',
                                fontWeight: '700',
                                background: 'radial-gradient(85.89% 289.58% at 95.2978056426% 14.5833333333%, rgb(255, 216, 64) 0%, rgb(243, 172, 255) 55.86%, rgb(138, 236, 255) 100%)'
                            }}>
                                <svg className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4890" width="25" height="25"><path d="M576 85.333333c0 18.944-8.234667 35.968-21.333333 47.701334V213.333333h213.333333a128 128 0 0 1 128 128v426.666667a128 128 0 0 1-128 128H256a128 128 0 0 1-128-128V341.333333a128 128 0 0 1 128-128h213.333333V133.034667A64 64 0 1 1 576 85.333333zM256 298.666667a42.666667 42.666667 0 0 0-42.666667 42.666666v426.666667a42.666667 42.666667 0 0 0 42.666667 42.666667h512a42.666667 42.666667 0 0 0 42.666667-42.666667V341.333333a42.666667 42.666667 0 0 0-42.666667-42.666666H256z m-170.666667 128H0v256h85.333333v-256z m853.333334 0h85.333333v256h-85.333333v-256zM384 618.666667a64 64 0 1 0 0-128 64 64 0 0 0 0 128z m256 0a64 64 0 1 0 0-128 64 64 0 0 0 0 128z" fill="#000000" p-id="4891"></path></svg>
                                <span style={{ marginLeft: '16px' }}>Monika Bot</span></Button></a>
                    </Link>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default MainDisplay;

