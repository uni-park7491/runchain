import { ContractService } from './ContractService';

const svc = new ContractService();

export async function fetchAllChallenges() {
  const count = await svc.getChallengeCount();
  const ids = Array.from({ length: count }, (_, i) => i + 1);
  const challenges = await Promise.all(ids.map(id => svc.getChallengeInfo(id)));
  return challenges.reverse(); // 최신순
}

export async function fetchActiveChallenges(userAddress: string) {
  if (!userAddress) return [];
  const ids = await svc.getUserChallenges(userAddress);
  const challenges = await Promise.all(ids.map(id => svc.getChallengeInfo(id)));
  return challenges.filter(c => c.status === 1); // 진행 중인 것만
}
