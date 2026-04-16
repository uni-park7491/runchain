import { create } from 'zustand';
import type { ChallengeData } from '@/lib/contract';

interface ChallengeState {
  challenges: ChallengeData[];
  loading: boolean;
  setChallenges: (challenges: ChallengeData[]) => void;
  addChallenge: (challenge: ChallengeData) => void;
  setLoading: (loading: boolean) => void;
}

export const useChallengeStore = create<ChallengeState>((set) => ({
  challenges: [],
  loading: false,
  setChallenges: (challenges) => set({ challenges }),
  addChallenge: (challenge) =>
    set((state) => ({ challenges: [...state.challenges, challenge] })),
  setLoading: (loading) => set({ loading }),
}));
