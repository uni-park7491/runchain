export const STORAGE_KEYS = {
  PIN_HASH: 'rc_pin_hash',
  WALLET: 'runchain-wallet',
  PWA_DISMISSED: 'rc_pwa_dismissed',
  STRAVA_TOKEN: 'rc_strava_token',
  ONBOARDED: 'rc_onboarded',
} as const;

const isBrowser = typeof window !== 'undefined';

export const storage = {
  get: (key: string): string | null => {
    if (!isBrowser) return null;
    return localStorage.getItem(key);
  },
  set: (key: string, value: string): void => {
    if (!isBrowser) return;
    localStorage.setItem(key, value);
  },
  remove: (key: string): void => {
    if (!isBrowser) return;
    localStorage.removeItem(key);
  },
  setPinHash: (hash: string) => storage.set(STORAGE_KEYS.PIN_HASH, hash),
  getPinHash: () => storage.get(STORAGE_KEYS.PIN_HASH),
  setPwaDismissed: () => storage.set(STORAGE_KEYS.PWA_DISMISSED, '1'),
  isPwaDismissed: () => storage.get(STORAGE_KEYS.PWA_DISMISSED) === '1',
  setStravaToken: (token: object) =>
    storage.set(STORAGE_KEYS.STRAVA_TOKEN, JSON.stringify(token)),
  getStravaToken: () => {
    const raw = storage.get(STORAGE_KEYS.STRAVA_TOKEN);
    return raw ? JSON.parse(raw) : null;
  },
  hasWallet: (): boolean => {
    if (!isBrowser) return false;
    const raw = storage.get(STORAGE_KEYS.WALLET);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      return !!parsed?.state?.address;
    } catch {
      return false;
    }
  },
  clearAll: () => {
    if (!isBrowser) return;
    Object.values(STORAGE_KEYS).forEach((k) => storage.remove(k));
  },
};
