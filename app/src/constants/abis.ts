// RunChain 컨트랙트 ABI
export const RUNCHAIN_ABI = [
  // 컨트랙트 정보 조회
  "function challengeCount() view returns (uint256)",
  "function getChallengeInfo(uint256 id) view returns (string name, address creator, uint256 entryFee, uint256 startTime, uint256 endTime, uint256 totalPool, uint256 participantCount, uint8 status)",
  "function getParticipantInfo(uint256 challengeId, address participant) view returns (uint256 totalKm, uint256 dailyKm, uint8 warnings, bool disqualified, bool withdrawn)",
  "function getTreasuryInfo() view returns (uint256 total, uint256 monthly, bool bonusReady)",
  "function getPlatformStats() view returns (uint256 totalChallenges, uint256 totalParticipations, uint256 totalDistributed, uint256 treasury)",
  "function getUserChallenges(address user) view returns (uint256[])",
  "function getParticipantList(uint256 challengeId) view returns (address[])",
  // 참가자 함수
  "function createChallenge(string name, uint256 entryFee) returns (uint256)",
  "function joinChallenge(uint256 challengeId)",
  "function withdraw(uint256 challengeId)",
  // 이벤트
  "event ChallengeCreated(uint256 indexed id, address indexed creator, uint256 entryFee, uint256 startTime)",
  "event ParticipantJoined(uint256 indexed challengeId, address indexed participant)",
  "event RecordSubmitted(uint256 indexed challengeId, address indexed participant, uint256 kmX100)",
  "event WarningIssued(uint256 indexed challengeId, address indexed participant, uint8 warningCount)",
  "event ParticipantDisqualified(uint256 indexed challengeId, address indexed participant)",
  "event ChallengeFinalized(uint256 indexed challengeId, address rank1, address rank2, address rank3)",
  "event PrizeDistributed(uint256 indexed challengeId, address indexed recipient, uint256 amount, uint8 rank)",
  "event TreasuryDeposit(uint256 indexed challengeId, uint256 amount, string reason)",
  "event BonusDistributed(uint256 indexed challengeId, address indexed recipient, uint256 amount)",
];

export const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];
