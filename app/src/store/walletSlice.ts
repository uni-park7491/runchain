import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WalletState {
  hasWallet: boolean;
  address: string | null;
  isLocked: boolean;
  useBiometric: boolean;
}

const initialState: WalletState = {
  hasWallet: false,
  address: null,
  isLocked: false,
  useBiometric: false,
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    finishOnboarding: (state, action: PayloadAction<{ useBiometric: boolean }>) => {
      state.hasWallet = true;
      state.isLocked = false;
      state.useBiometric = action.payload.useBiometric;
    },
    setAddress: (state, action: PayloadAction<string>) => { state.address = action.payload; },
    lock: (state) => { state.isLocked = true; },
    unlock: (state) => { state.isLocked = false; },
    reset: () => initialState,
  },
});

export const { finishOnboarding, setAddress, lock, unlock, reset } = walletSlice.actions;
export default walletSlice.reducer;
