// 네트워크 설정
export const NETWORK = {
  BSC_TESTNET: {
    chainId: 97,
    name: 'BSC Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    explorer: 'https://testnet.bscscan.com',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  },
  BSC_MAINNET: {
    chainId: 56,
    name: 'BNB Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    explorer: 'https://bscscan.com',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  },
};

// 사용할 네트워크 (개발 중: testnet, 운영: mainnet)
export const ACTIVE_NETWORK = __DEV__ ? NETWORK.BSC_TESTNET : NETWORK.BSC_MAINNET;

// 컨트랙트 주소
export const CONTRACTS = {
  RUNCHAIN_TESTNET: process.env.EXPO_PUBLIC_CONTRACT_TESTNET || '',
  RUNCHAIN_MAINNET: process.env.EXPO_PUBLIC_CONTRACT_MAINNET || '',
  USDT_TESTNET: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
  USDT_MAINNET: '0x55d398326f99059fF775485246999027B3197955',
};

export const ACTIVE_CONTRACT = __DEV__
  ? CONTRACTS.RUNCHAIN_TESTNET
  : CONTRACTS.RUNCHAIN_MAINNET;

export const ACTIVE_USDT = __DEV__
  ? CONTRACTS.USDT_TESTNET
  : CONTRACTS.USDT_MAINNET;

// 체인지 룰
export const CHALLENGE_RULES = {
  DURATION_DAYS: 7,
  MAX_PARTICIPANTS: 30,
  MIN_ENTRY_FEE_USDT: 1,
  MIN_KM_PER_DAY: 3,
  MAX_KM_PER_DAY: 10,
  MAX_WARNINGS: 3,
  // AI 페이스 검증: km당 최대 속도 (km/h)
  MAX_PACE_KMH: 24,         // km당 2분 30초 ≈ 24km/h
  SUSPICIOUS_PACE_KMH: 20,  // 모니터링 대상
  GPS_JUMP_THRESHOLD_M: 100, // 1초당 100m 이상 이동 시 의심
};

// 상금 분배 비율
export const PRIZE_DISTRIBUTION = {
  RANK_1: 0.50,
  RANK_2: 0.35,
  RANK_3: 0.15,
};

// 외부 API
export const API = {
  OPENWEATHER_KEY: process.env.EXPO_PUBLIC_WEATHER_API_KEY || '',
  STRAVA_CLIENT_ID: process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID || '',
  STRAVA_CLIENT_SECRET: process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET || '',
  FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL || 'https://us-central1-runchain-app.cloudfunctions.net',
};

// 앱 테마 색상
export const COLORS = {
  primary: '#00E5A0',
  background: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceAlt: '#242424',
  border: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#888888',
  warning: '#FF9500',
  error: '#FF3B30',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};
