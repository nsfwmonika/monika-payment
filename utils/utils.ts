import axios from 'axios';
import { API_URLS } from '@raydium-io/raydium-sdk-v2';
import { NATIVE_MINT } from '@solana/spl-token';

const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT;

interface TransferActivationParams {
  chain: string;
  walletAddress: string;
  usd: number;
  userId: string;
}
interface TransferActivationResponse {
  success: boolean;
  data?: any;
  message?: string;
}
export async function fetchSolSwapResponse(outputMint: string | number): Promise<number | null> {
  if (!outputMint || typeof outputMint !== 'number' || outputMint <= 0) {
    return null;
  }

  try {
    const swapResponse = await axios.get(API_URLS.SWAP_HOST + `/compute/swap-base-in?inputMint=${USDC_MINT}&outputMint=${NATIVE_MINT.toString()}&amount=${outputMint * 1e6}&slippageBps=50&txVersion=V0`);

    if (swapResponse?.data?.success) {
      const outputAmount = swapResponse.data.data?.outputAmount;
      const swapAmount = Number(outputAmount) / 1e9;
      return swapAmount;
    }
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
  }

  return null;
}


export async function transferActivation({
  chain,
  walletAddress,
  usd,
  userId
}: TransferActivationParams): Promise<TransferActivationResponse> {
  try {
    const queryParams = new URLSearchParams(window.location.search);
    const sid = queryParams.get('sid') || null;

    const parameter = {
      sid,
      chain,
      wallet_address: walletAddress,
      usd,
      userId
    };

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_WEBAPI}/payment/active`,
      parameter
    );
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('transferActivation error:', error instanceof Error ? error.message : error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}


