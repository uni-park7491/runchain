import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  address: string | null;
  encryptedPrivateKey: string | null;
  encryptedMnemonic: string | null;
  usdtBalance: string;
  bnbBalance: string;
  isUnlocked: boolean;
  setWallet: (address: string, encryptedKey: string, encryptedMnemonic: string) => void;
  setBalances: (usdt: string, bnb: string) => void;
  setUnlocked: (value: boolean) => void;
  clearWallet: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      encryptedPrivateKey: null,
      encryptedMnemonic: null,
      usdtBalance: '0.00',
      bnbBalance: '0.0000',
      isUnlocked: false,
      setWallet: (address, encryptedPrivateKey, encryptedMnemonic) =>
        set({ address, encryptedPrivateKey, encryptedMnemonic }),
      setBalances: (usdtBalance, bnbBalance) => set({ usdtBalance, bnbBalance }),
      setUnlocked: (isUnlocked) => set({ isUnlocked }),
      clearWallet: () =>
        set({
          address: null,
          encryptedPrivateKey: null,
          encryptedMnemonic: null,
          usdtBalance: '0.00',
          bnbBalance: '0.0000',
          isUnlocked: false,
        }),
    }),
    {
      name: 'runchain-wallet',
      partialize: (state) => ({
        address: state.address,
        encryptedPrivateKey: state.encryptedPrivateKey,
        encryptedMnemonic: state.encryptedMnemonic,
      }),
    }
  )
);
