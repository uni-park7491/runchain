import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Challenge { id: number; name: string; status: number; entryFee: number; totalPool: number; participantCount: number; }
interface ChallengeState { list: Challenge[]; loading: boolean; }

const initialState: ChallengeState = { list: [], loading: false };

export const challengeSlice = createSlice({
  name: 'challenge',
  initialState,
  reducers: {
    setChallenges: (state, action: PayloadAction<Challenge[]>) => { state.list = action.payload; },
    setLoading: (state, action: PayloadAction<boolean>) => { state.loading = action.payload; },
  },
});

export const { setChallenges, setLoading } = challengeSlice.actions;
export default challengeSlice.reducer;
