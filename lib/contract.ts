import { ethers } from 'ethers';
import { CONFIG } from './config';
import { getSigner, getProvider } from './wallet';

export const RUNCHAIN_ABI = [
  'function challengeCount() view returns (uint256)',
  'function getChallenge(uint256 id) view returns (uint256 id, string name, address creator, uint256 targetDistance, uint256 entryFee, uint256 startTime, uint256 endTime, bool active, bool finalized, uint256 participantCount, uint256 totalPool)',
  'function getParticipants(uint256 challengeId) view returns (address[])',
  'function getParticipantRecord(uint256 challengeId, address participant) view returns (uint256 distance, uint256 warnings, bool disqualified, bool rewarded)',
  'function treasuryBalance() view returns (uint256)',
  'function isParticipant(uint256 challengeId, address user) view returns (bool)',
  'function createChallenge(string name, uint256 targetDistance, uint256 entryFee, uint256 startTime, uint256 endTime) returns (uint256)',
  'function joinChallenge(uint256 challengeId)',
  'function withdrawFromChallenge(uint256 challengeId)',
  'function submitRecord(uint256 challengeId, address participant, uint256 distance, bytes32 gpsHash)',
  'function issueWarning(uint256 challengeId, address participant)',
  'function finalizeChallenge(uint256 challengeId)',
  'function activateChallenge(uint256 challengeId)',
  'event ChallengeCreated(uint256 indexed challengeId, string name, address indexed creator, uint256 entryFee)',
  'event ParticipantJoined(uint256 indexed challengeId, address indexed participant)',
  'event RecordSubmitted(uint256 indexed challengeId, address indexed participant, uint256 distance)',
  'event WarningIssued(uint256 indexed challengeId, address indexed participant, uint256 warningCount)',
  'event ChallengeFinalized(uint256 indexed challengeId)',
  'event PrizeDistributed(uint256 indexed challengeId, address indexed winner, uint256 amount, uint256 rank)',
];

export const USDT_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

export interface ChallengeData {
  id: number;
  name: string;
  creator: string;
  targetDistance: number;
  entryFee: string;
  startTime: Date;
  endTime: Date;
  active: boolean;
  finalized: boolean;
  participantCount: number;
  totalPool: string;
}

export interface ParticipantRecord {
  distance: number;
  warnings: number;
  disqualified: boolean;
  rewarded: boolean;
}

export const getRunChainContract = (privateKey?: string) => {
  const runner = privateKey ? getSigner(privateKey) : getProvider();
  return new ethers.Contract(CONFIG.CONTRACT_ADDRESS, RUNCHAIN_ABI, runner);
};

export const getUsdtContract = (privateKey?: string) => {
  if (!CONFIG.USDT_ADDRESS) throw new Error('USDT 주소가 설정되지 않았습니다.');
  const runner = privateKey ? getSigner(privateKey) : getProvider();
  return new ethers.Contract(CONFIG.USDT_ADDRESS, USDT_ABI, runner);
};

export const parseChallengeData = (raw: any, id: number): ChallengeData => ({
  id,
  name: raw.name ?? raw[1],
  creator: raw.creator ?? raw[2],
  targetDistance: Number(raw.targetDistance ?? raw[3]),
  entryFee: ethers.formatUnits(raw.entryFee ?? raw[4], 18),
  startTime: new Date(Number(raw.startTime ?? raw[5]) * 1000),
  endTime: new Date(Number(raw.endTime ?? raw[6]) * 1000),
  active: raw.active ?? raw[7],
  finalized: raw.finalized ?? raw[8],
  participantCount: Number(raw.participantCount ?? raw[9]),
  totalPool: ethers.formatUnits(raw.totalPool ?? raw[10], 18),
});

export const fetchAllChallenges = async (): Promise<ChallengeData[]> => {
  const contract = getRunChainContract();
  const count = Number(await contract.challengeCount());
  const challenges: ChallengeData[] = [];
  for (let i = 0; i < count; i++) {
    try {
      const raw = await contract.getChallenge(i);
      challenges.push(parseChallengeData(raw, i));
    } catch (e) {
      console.error(`Challenge ${i} fetch error:`, e);
    }
  }
  return challenges;
};
