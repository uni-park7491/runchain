import { create } from 'zustand';
import type { GPSPoint } from '@/lib/gps';

interface RunState {
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  elapsedSeconds: number;
  gpsPoints: GPSPoint[];
  totalDistance: number;
  currentPace: string;
  heartRate: number | null;
  heartRateConnected: boolean;
  challengeId: number | null;
  setRunning: (v: boolean) => void;
  setPaused: (v: boolean) => void;
  setStartTime: (t: number) => void;
  setElapsed: (s: number) => void;
  updateGPS: (points: GPSPoint[], totalDistance: number) => void;
  setCurrentPace: (pace: string) => void;
  setHeartRate: (bpm: number | null) => void;
  setHeartRateConnected: (v: boolean) => void;
  setChallengeId: (id: number | null) => void;
  reset: () => void;
}

export const useRunStore = create<RunState>((set) => ({
  isRunning: false,
  isPaused: false,
  startTime: null,
  elapsedSeconds: 0,
  gpsPoints: [],
  totalDistance: 0,
  currentPace: '--:--',
  heartRate: null,
  heartRateConnected: false,
  challengeId: null,
  setRunning: (isRunning) => set({ isRunning }),
  setPaused: (isPaused) => set({ isPaused }),
  setStartTime: (startTime) => set({ startTime }),
  setElapsed: (elapsedSeconds) => set({ elapsedSeconds }),
  updateGPS: (gpsPoints, totalDistance) => set({ gpsPoints, totalDistance }),
  setCurrentPace: (currentPace) => set({ currentPace }),
  setHeartRate: (heartRate) => set({ heartRate }),
  setHeartRateConnected: (heartRateConnected) => set({ heartRateConnected }),
  setChallengeId: (challengeId) => set({ challengeId }),
  reset: () =>
    set({
      isRunning: false,
      isPaused: false,
      startTime: null,
      elapsedSeconds: 0,
      gpsPoints: [],
      totalDistance: 0,
      currentPace: '--:--',
      heartRate: null,
      challengeId: null,
    }),
}));
