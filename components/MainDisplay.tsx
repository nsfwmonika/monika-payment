/* eslint-disable @next/next/no-img-element */
import { FC, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL, Connection, clusterApiUrl } from '@solana/web3.js';
import { useTonWallet } from "@tonconnect/ui-react";
import { TonClient, Address, beginCell, toNano } from '@ton/ton';
import Link from "next/link";
import axios from 'axios';
import { fetchSolSwapResponse, transferActivation } from '../utils/utils';
import { Box, TextField, Select, MenuItem, Dialog, DialogTitle, DialogContentText, DialogContent, DialogActions, Button } from '@mui/material';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp'
import { ExchangeInfos } from './ExchangeInfos'


import SendSolana from './SendSolana';
import SendTon from './SendTon';
import UnitSelector from './UnitSelector';
import Notification from './Notification';
import test from 'node:test';

type SeverityType = 'success' | 'info' | 'warning' | 'error';

export const MainDisplay: FC = () => {
    const NEXT_PUBLIC_TON_RPC_MAINNET = process.env.NEXT_PUBLIC_TON_RPC_MAINNET
    const NEXT_PUBLIC_TON_RPC_DEVNET = process.env.NEXT_PUBLIC_TON_RPC_DEVNET
    const USDT_ADDRESS = Address.parse(process.env.NEXT_PUBLIC_TON_CONTRACT_USDT || '');



    const tonRPC = useMemo(() => {
        let networkFromStorage: string | null = null;
        if (typeof window !== 'undefined') {
            try {
                networkFromStorage = localStorage.getItem("network");
            } catch (error) {
                console.error("localStorage error:", error);
            }
        }
        let endpoint: string;

        if (networkFromStorage === "testnet") {
            endpoint = NEXT_PUBLIC_TON_RPC_DEVNET || ''
        } else {
            endpoint = NEXT_PUBLIC_TON_RPC_MAINNET || ''
        }
        return endpoint;
    }, [NEXT_PUBLIC_TON_RPC_DEVNET, NEXT_PUBLIC_TON_RPC_MAINNET]);

    const timerRef = useRef<NodeJS.Timeout>();
    const USDC_MINT = useMemo(() => new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT || ''), []);
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
    const isTelegramLoaded = useTelegramWebApp()

    const walletTon = useTonWallet();
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [tonBalance, setTonBalance] = useState<string | null>(null);
    const [usdtBalance, setUsdtBalance] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    const [chainType, setChainType] = useState('');
    const [severityType, setSeverity] = useState<SeverityType>('info');
    const [messages, setMessages] = useState('');

    const [balanceSol, setSolBalance] = useState(0);
    const [balanceUsdc, setUsdcBalance] = useState(0);
    const { connection } = useConnection();
    const { publicKey } = useWallet();


    const [loadingSol, setLoadingSol] = useState(false);
    const [amount, setAmount] = useState<string>('');
    const [customAmount, setCustomAmount] = useState<string>('50');

    const [tonUserId, setTonUserId] = useState('');
    const [tokenType, setTokenType] = useState('');
    const [userFriendlyAddress, setUserFriendlyAddress] = useState("");


    const [svgAnimation, setSvgAnimation] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState("50U");
    const [exchangeInfo, setExchangeInfo] = useState({
        basePoints: null,
        chainPrice: null,
        level: null,
        rebatePercentage: null,
        rewardPoints: null
    });
    const tokenTypeRef = useRef(tokenType);

    useEffect(() => {
        const initializeTokenType = () => {
            try {
                const currentPath = window.location.href;
                if (currentPath.indexOf("solana") === -1) {
                    setTokenType("TON");
                    setChainType("ton");
                    setAmount("1");

                    let href = window.location.href
                    let userId = ''
                    try {
                        href = href.split("=")[1];
                        let b = href.split("&");
                        let decodedUrl = decodeURIComponent(b[0]);
                        decodedUrl = decodeURIComponent(decodedUrl)
                        const params = new URLSearchParams(decodedUrl)
                        let temp = decodedUrl.split("&")[0].split("=")[1]
                        console.log('userId:', JSON.parse(temp).id);
                        userId = String(JSON.parse(temp).id)
                        setTonUserId(userId)
                        handleUnitSelect("50U", "ton", userId);
                    } catch (error) {
                        console.log('error---userInfo---', error)
                    }
                } else {
                    setTokenType("SOL");
                    setChainType("solana");
                    handleUnitSelect("50U", "solana","");
                }
            } catch (error) {
                setTokenType("SOL");
                setChainType("solana");
            }
        };
        initializeTokenType();





    }, [])
    useEffect(() => {
        tokenTypeRef.current = tokenType;
    }, [tokenType]);

    useEffect(() => {
        if (walletTon) {
            setWalletAddress(walletTon.account.address);
            fetchTonBalance(walletTon.account.address);
            try {
                const address = Address.parse(walletTon.account.address);
                const friendlyAddress = address.toString({
                    urlSafe: true,
                    bounceable: false,
                    testOnly: false
                });
                setUserFriendlyAddress(friendlyAddress)
            } catch (error) {
            }

        } else {
            setWalletAddress(null);
            setTonBalance(null);
        }
    }, [walletTon]);

    const fetchTonBalance = async (address: string) => {
        try {
            const client = new TonClient({
                endpoint: tonRPC,
            });
            const balance = await client.getBalance(Address.parse(address));
            let val = (Number(balance) / 1e9).toFixed(2)
            setTonBalance(val);
        } catch (error) {
            console.error('Error fetching TON balance:', error);
            setTonBalance(null);
        }
        // GET TON Chain USDT balance
        // try {
        //     const client = new TonClient({
        //         endpoint: 'https://toncenter.com/api/v2/jsonRPC',
        //     });
        //     const userAddress = Address.parse(walletAddress || "");
        //     const addressCell = beginCell().storeAddress(userAddress).endCell();
        //     const { stack } = await client.runMethod(USDT_ADDRESS, 'get_wallet_data', [{
        //         type: 'cell',
        //         cell: addressCell
        //     }]);
        //     console.log('stack---', stack)
        //     // if (stack.length > 0) {
        //     //     const balance = stack[0];
        //     //     const val = (Number(balance) / 1e6).toFixed(2);
        //     //     setUsdtBalance(val);
        //     // } else {
        //     //     setUsdtBalance('0.00');
        //     // }
        // } catch (error) {
        //     console.error('Error fetching USDT balance:', error);
        //     setUsdtBalance(null);
        // } finally {
        // }
    };

    const onTransactionStatusTON = (status: boolean) => {
        fetchTonBalance(walletAddress || '')
    }

    const fetchBalanceSOLANA = useCallback(async () => {
        if (!publicKey) {
            console.error('Public key is null');
            setSolBalance(0);
            setUsdcBalance(0);
            return;
        }

        try {
            const walletBalance = await connection.getBalance(publicKey);
            setSolBalance(walletBalance / LAMPORTS_PER_SOL);
        } catch (error) {
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
            setUsdcBalance(0);
        }
    }, [connection, publicKey, USDC_MINT]);

    const onTransactionStatusSOLANA = (status: boolean) => {
        fetchBalanceSOLANA()
    }


    useEffect(() => {
        if (!connection || !publicKey) {
            setSolBalance(0);
            setLoadingSol(false)
            return;
        }
        const isConnection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
        if (!isConnection.rpcEndpoint.includes('mainnet-beta')) {
            handleNotificationOpen('transaction', 'Unsupported network. Please connect to Ethereum or Solana!', 'warning');
            return;
        }
        fetchBalanceSOLANA();
    }, [connection, publicKey, fetchBalanceSOLANA]);

    const handleChange = async (value: string) => {
        setAmount('')
        setTokenType(value);
        if (chainType === 'solana') {
            if (value === 'USDC') {
                setAmount(customAmount)
            } else {
                exchangeResult("solana", publicKey?.toBase58() || '', customAmount, value,"")
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

    const handleUnitSelect = async (unit: string, type: string, userId: any) => {
        setSelectedUnit(unit);
        setAmount('')
        let val = parseFloat(unit.replace('U', ''));
        setCustomAmount(String(val))
        setSvgAnimation(true)
        if (chainType === 'solana' || type === 'solana') {
            exchangeResult("solana", publicKey?.toBase58() || '', val, tokenType,userId)
        } else {
            setLoadingSol(true)
            exchangeResult("ton", walletAddress || '', val, tokenType,userId)
        }
    };

    const exchangeResult = async (chain: any, walletAddress: any, usd: any, tokenType: any, userId: any) => {
        setLoadingSol(true)
        setAmount("")
        setLoadingSol(true)
        setSvgAnimation(true)
        try {
            const result = await transferActivation({
                chain,
                walletAddress: chain === 'ton' ? userFriendlyAddress : walletAddress,
                usd,
                userId
            });
            setSvgAnimation(false)
            setLoadingSol(false)
            if (result.success) {
                let temp = result.data.data
                if (temp.rewardPoints > 0) {
                    temp.basePoints = temp.basePoints + temp.rewardPoints
                }
                if (temp?.rebatePercentage) {
                    temp.rebatePercentage = temp.rebatePercentage * 100 + '%'
                }

                setExchangeInfo(temp)
                if (tokenType === "USDC" || tokenType === "USDT") {
                    setAmount(String(usd));
                } else {
                    setAmount(String((Number(usd) / temp.chainPrice).toFixed(9)));
                }
            }
            // setOpen(result?.data?.code === 200 ? false : true);
        } catch (error) {
            console.error('activation error:', error);
            // setOpen(true);
        }
    }


    const debouncedAmount = useCallback((value: string, isChainType: string, type: string) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            debouncedAmountSend(value, isChainType, type);
        }, 500);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const debouncedAmountSend = async (value: string, isChainType: string, type: string) => {
        setAmount("")
        let tempAmount = value?.indexOf('U') !== -1 ? parseFloat(value.replace('U', '')) : +value
        if (isChainType === 'solana' && tempAmount > 0) {
            exchangeResult("solana", publicKey?.toBase58() || '', tempAmount, tokenTypeRef.current,"")

        } else if (isChainType === 'ton') {
            exchangeResult("ton", walletAddress || '', tempAmount, tokenTypeRef.current,tonUserId)
        }
    }
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCustomAmount(event.target.value)
        setSelectedUnit("");
        debouncedAmount(event.target.value, chainType, tokenTypeRef.current)
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // if (e.key === '.' || e.key === ',') {
        //     e.preventDefault();
        //     return;
        // }
        // if (e.key === 'Backspace' || e.key === 'Delete') {
        //     return;
        // }
        // if (
        //     !/^\d$/.test(e.key) &&
        //     !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)
        // ) {
        //     e.preventDefault();
        // }
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
                </div>
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
                    <div className='groud-select' style={{
                        paddingRight: "0"
                    }}>
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
                                paddingRight: "16px",
                                display: "flex",
                                alignItems: "center",
                                color: '#ffffff'
                            }}>
                                {
                                    svgAnimation ?
                                        <svg style={{
                                            animation: "rotate 1s linear infinite",
                                        }} className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4480" width="18" height="18"><path d="M64 512a448 448 0 1 0 448-448 32 32 0 0 0 0 64 384 384 0 1 1-384 384 32 32 0 0 0-64 0z" fill="#ff842d" p-id="4481"></path></svg>
                                        : ""
                                }
                                {amount}
                            </div>
                        </div>

                    </div>
                    <ExchangeInfos {...exchangeInfo}></ExchangeInfos>
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

