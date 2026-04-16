export const CONFIG = {
  CHAIN_ID: 97,
  CHAIN_NAME: 'BNB Smart Chain Testnet',
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
  EXPLORER_URL: 'https://testnet.bscscan.com',
  CONTRACT_ADDRESS:
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
    '0x36551a174D59C7A0F9383EB02285BC70D0e60A9d',
  USDT_ADDRESS: process.env.NEXT_PUBLIC_USDT_ADDRESS || '',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  STRAVA_CLIENT_ID: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || '',
} as const;

export const ENTRY_FEE_OPTIONS = [5, 10, 20, 50] as const;

export const PRIZE_DISTRIBUTION: Record<string, string> = {
  '1st': '50%',
  '2nd': '35%',
  '3rd': '15%',
  '4th+': 'Treasury',
};
