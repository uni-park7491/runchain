import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const PW_HASH_KEY = 'runchain_pw_hash';

export async function savePassword(password: string): Promise<void> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password + 'runchain_salt_v1'
  );
  await SecureStore.setItemAsync(PW_HASH_KEY, hash);
}

export async function verifyPassword(password: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PW_HASH_KEY);
  if (!stored) return false;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password + 'runchain_salt_v1'
  );
  return hash === stored;
}

export async function hasPassword(): Promise<boolean> {
  return !!(await SecureStore.getItemAsync(PW_HASH_KEY));
}
