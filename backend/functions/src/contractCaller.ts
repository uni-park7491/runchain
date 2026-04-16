import { ethers } from 'ethers';
import * as functions from 'firebase-functions';

const RUNCHAIN_ABI = [
  "function submitRecord(uint256 challengeId, address participant, uint256 kmX100, bool warn) external",
  "function activateChallenge(uint256 challengeId) external",
  "function finalizeChallenge(uint256 challengeId, address rank1, address rank2, address rank3) external",
  "function distributeMonthlyBonus(uint256 challengeId, address[] calldata recipients) external",
  "function resetMonthlyTreasury() external",
  "function getChallengeInfo(uint256 id) view returns (string, address, uint256, uint256, uint256, uint256, uint256, uint8)",
  "function getParticipantList(uint256 id) view returns (address[])",
  "function getParticipantInfo(uint256, address) view returns (uint256, uint256, uint8, bool, bool)",
  "function challengeCount() view returns (uint256)",
];

export async function getVerifierWallet(): Promise<ethers.Wallet> {
  const config = functions.config();
  const privateKey = config.verifier?.private_key;
  const rpcUrl = config.chain?.rpc_url || 'https://data-seed-prebsc-1-s1.binance.org:8545';
  if (!privateKey) throw new Error('VERIFIER_PRIVATE_KEY 미설정');
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Wallet(privateKey, provider);
}

export async function getRunChainContract() {
  const config = functions.config();
  const contractAddress = config.contract?.address;
  if (!contractAddress) throw new Error('CONTRACT_ADDRESS 미설정');
  const wallet = await getVerifierWallet();
  return new ethers.Contract(contractAddress, RUNCHAIN_ABI, wallet);
}
