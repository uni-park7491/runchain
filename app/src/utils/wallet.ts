import * as bip39 from 'bip39';

export async function generateMnemonic(): Promise<string> {
  return bip39.generateMnemonic(128);
}

export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}
