import { ethers } from 'ethers';
import * as SecureStore from 'expo-secure-store';
import { ACTIVE_NETWORK, ACTIVE_USDT, ERC20_ABI } from '@/constants';
import { ERC20_ABI as ERC20 } from '@/constants/abis';
import { ACTIVE_CONTRACT, RUNCHAIN_ABI } from '@/constants/abis';

const KEYS = {
  ENCRYPTED_WALLET: 'runchain_encrypted_wallet',
  ADDRESS: 'runchain_address',
};

export class WalletService {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(ACTIVE_NETWORK.rpcUrl);
  }

  /** 새 지갑 생성 (니모닉 기반) */
  static async createWallet(): Promise<{ address: string; mnemonic: string }> {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      mnemonic: wallet.mnemonic!.phrase,
    };
  }

  /** 니모닉으로 지갑 복구 */
  static async restoreFromMnemonic(mnemonic: string): Promise<string> {
    const wallet = ethers.Wallet.fromPhrase(mnemonic);
    return wallet.address;
  }

  /** 지갑을 비밀번호로 암호화해 SecureStore에 저장 */
  static async saveEncryptedWallet(mnemonic: string, password: string): Promise<string> {
    const wallet = ethers.Wallet.fromPhrase(mnemonic);
    const encrypted = await wallet.encrypt(password);
    await SecureStore.setItemAsync(KEYS.ENCRYPTED_WALLET, encrypted);
    await SecureStore.setItemAsync(KEYS.ADDRESS, wallet.address);
    return wallet.address;
  }

  /** 비밀번호로 지갑 복호화 */
  static async unlockWallet(password: string): Promise<ethers.Wallet> {
    const encrypted = await SecureStore.getItemAsync(KEYS.ENCRYPTED_WALLET);
    if (!encrypted) throw new Error('저장된 지갑이 없습니다');
    return ethers.Wallet.fromEncryptedJson(encrypted, password);
  }

  /** 저장된 주소 조회 */
  static async getSavedAddress(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.ADDRESS);
  }

  /** USDT 잔액 조회 */
  async getUSDTBalance(address: string): Promise<string> {
    const usdt = new ethers.Contract(ACTIVE_USDT, ERC20, this.provider);
    const balance = await usdt.balanceOf(address);
    return ethers.formatUnits(balance, 6);
  }

  /** BNB 잔액 조회 */
  async getBNBBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return parseFloat(ethers.formatEther(balance)).toFixed(4);
  }

  /** 서명된 컨트랙트 인스턴스 반환 */
  async getSignedContract(password: string) {
    const wallet = await WalletService.unlockWallet(password);
    const signer = wallet.connect(this.provider);
    return new ethers.Contract(ACTIVE_CONTRACT, RUNCHAIN_ABI, signer);
  }

  /** USDT approve (컨트랙트에 전송 허용) */
  async approveUSDT(amount: string, password: string): Promise<void> {
    const wallet = await WalletService.unlockWallet(password);
    const signer = wallet.connect(this.provider);
    const usdt = new ethers.Contract(ACTIVE_USDT, ERC20, signer);
    const amountWei = ethers.parseUnits(amount, 6);
    const tx = await usdt.approve(ACTIVE_CONTRACT, amountWei);
    await tx.wait();
  }
}
