import { ethers } from 'ethers';
import { ACTIVE_NETWORK, ACTIVE_CONTRACT, ACTIVE_USDT } from '@/constants/config';
import { RUNCHAIN_ABI, ERC20_ABI } from '@/constants/abis';
import { WalletService } from './WalletService';

export class ContractService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(ACTIVE_NETWORK.rpcUrl);
    this.contract = new ethers.Contract(ACTIVE_CONTRACT, RUNCHAIN_ABI, this.provider);
  }

  // ── 읽기 함수 (지갑 불필요) ──────────────────

  async getChallengeInfo(id: number) {
    const raw = await this.contract.getChallengeInfo(id);
    return {
      id,
      name: raw.name,
      creator: raw.creator,
      entryFee: Number(ethers.formatUnits(raw.entryFee, 6)),
      startTime: Number(raw.startTime),
      endTime: Number(raw.endTime),
      totalPool: Number(ethers.formatUnits(raw.totalPool, 6)),
      participantCount: Number(raw.participantCount),
      status: Number(raw.status),
    };
  }

  async getParticipantInfo(challengeId: number, address: string) {
    const raw = await this.contract.getParticipantInfo(challengeId, address);
    return {
      totalKm: Number(raw.totalKm),
      dailyKm: Number(raw.dailyKm),
      warnings: Number(raw.warnings),
      disqualified: raw.disqualified,
      withdrawn: raw.withdrawn,
    };
  }

  async getTreasuryInfo() {
    const raw = await this.contract.getTreasuryInfo();
    return {
      total: Number(ethers.formatUnits(raw.total, 6)),
      monthly: Number(ethers.formatUnits(raw.monthly, 6)),
      bonusReady: raw.bonusReady,
    };
  }

  async getPlatformStats() {
    const raw = await this.contract.getPlatformStats();
    return {
      totalChallenges: Number(raw._totalChallenges),
      totalParticipations: Number(raw._totalParticipations),
      totalDistributed: Number(ethers.formatUnits(raw._totalDistributed, 6)),
      treasury: Number(ethers.formatUnits(raw._treasury, 6)),
    };
  }

  async getUserChallenges(address: string): Promise<number[]> {
    const raw = await this.contract.getUserChallenges(address);
    return raw.map((id: bigint) => Number(id));
  }

  async getParticipantList(challengeId: number): Promise<string[]> {
    return this.contract.getParticipantList(challengeId);
  }

  async getChallengeCount(): Promise<number> {
    return Number(await this.contract.challengeCount());
  }

  // ── 쓰기 함수 (지갑 + 비밀번호 필요) ────────

  async createChallenge(name: string, entryFeeUsdt: number, password: string): Promise<number> {
    const walletSvc = new WalletService();
    const amountStr = entryFeeUsdt.toString();
    await walletSvc.approveUSDT(amountStr, password);
    const signed = await walletSvc.getSignedContract(password);
    const tx = await signed.createChallenge(
      name,
      ethers.parseUnits(amountStr, 6)
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find((l: any) => {
      try { return signed.interface.parseLog(l)?.name === 'ChallengeCreated'; } catch { return false; }
    });
    if (event) {
      const parsed = signed.interface.parseLog(event);
      return Number(parsed?.args?.id);
    }
    return 0;
  }

  async joinChallenge(challengeId: number, entryFeeUsdt: number, password: string): Promise<void> {
    const walletSvc = new WalletService();
    await walletSvc.approveUSDT(entryFeeUsdt.toString(), password);
    const signed = await walletSvc.getSignedContract(password);
    const tx = await signed.joinChallenge(challengeId);
    await tx.wait();
  }

  async withdrawFromChallenge(challengeId: number, password: string): Promise<void> {
    const walletSvc = new WalletService();
    const signed = await walletSvc.getSignedContract(password);
    const tx = await signed.withdraw(challengeId);
    await tx.wait();
  }
}
