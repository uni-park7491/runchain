import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';
import { CONFIG } from './config';

export const generateWallet = () => {
  const wallet = ethers.Wallet.createRandom();
  return {
    mnemonic: wallet.mnemonic!.phrase,
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
};

export const restoreWallet = (mnemonic: string) => {
  const wallet = ethers.Wallet.fromPhrase(mnemonic.trim());
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
};

export const encryptData = (data: string, pin: string): string => {
  return CryptoJS.AES.encrypt(data, pin).toString();
};

export const decryptData = (encrypted: string, pin: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, pin);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return '';
  }
};

export const hashPin = (pin: string): string => {
  return CryptoJS.SHA256(pin + 'rc_salt_2024').toString();
};

export const verifyPin = (pin: string, storedHash: string): boolean => {
  return hashPin(pin) === storedHash;
};

export const getProvider = () => {
  return new ethers.JsonRpcProvider(CONFIG.RPC_URL);
};

export const getSigner = (privateKey: string) => {
  return new ethers.Wallet(privateKey, getProvider());
};

export const formatAddress = (address: string): string => {
  if (!address || address.length < 10) return address || '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatUsdt = (amount: bigint | string): string => {
  const val = typeof amount === 'bigint' ? ethers.formatUnits(amount, 18) : amount;
  return parseFloat(val).toFixed(2);
};

export const formatBnb = (amount: bigint | string): string => {
  const val = typeof amount === 'bigint' ? ethers.formatEther(amount) : amount;
  return parseFloat(val).toFixed(4);
};
