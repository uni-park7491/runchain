import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { unlock } from '@/store/walletSlice';
import { verifyPassword } from '@/utils/encryption';
import { COLORS } from '@/constants/config';

export default function LockScreen() {
  const dispatch = useDispatch();
  const { useBiometric } = useSelector((s: RootState) => s.wallet);
  const [pw, setPw] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  const handleBiometric = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'RunChain 잠금 해제',
      cancelLabel: '비밀번호 입력',
    });
    if (result.success) dispatch(unlock());
  };

  const handlePassword = async () => {
    if (locked) {
      Alert.alert('잠금', '30분 후 다시 시도해주세요.');
      return;
    }
    const ok = await verifyPassword(pw);
    if (ok) {
      dispatch(unlock());
    } else {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= 5) {
        setLocked(true);
        setTimeout(() => { setLocked(false); setAttempts(0); }, 30 * 60 * 1000);
        Alert.alert('잠금', '5회 실패로 30분간 잠금됩니다.');
      } else {
        Alert.alert('오류', `비밀번호가 틀렸습니다. (${next}/5)`);
      }
      setPw('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🏃 RunChain</Text>
      <Text style={styles.title}>잠금 해제</Text>

      {useBiometric && (
        <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometric}>
          <Text style={styles.biometricIcon}>🪪</Text>
          <Text style={styles.biometricText}>Face ID / 지문으로 해제</Text>
        </TouchableOpacity>
      )}

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.or}>또는</Text>
        <View style={styles.line} />
      </View>

      <TextInput
        style={styles.input}
        placeholder="비밀번호 입력"
        placeholderTextColor="#555"
        secureTextEntry
        value={pw}
        onChangeText={setPw}
        autoCapitalize="none"
        editable={!locked}
      />
      <TouchableOpacity
        style={[styles.btn, locked && styles.btnDisabled]}
        onPress={handlePassword}
        disabled={locked}
      >
        <Text style={styles.btnText}>확인</Text>
      </TouchableOpacity>

      {attempts > 0 && (
        <Text style={styles.warn}>비밀번호 오류 {attempts}/5</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.background,
    justifyContent: 'center', padding: 32,
  },
  logo: { fontSize: 32, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 32 },
  biometricBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 20,
  },
  biometricIcon: { fontSize: 32, marginBottom: 6 },
  biometricText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: COLORS.border },
  or: { color: COLORS.textSecondary, fontSize: 13 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 17, fontWeight: '700', color: '#000' },
  warn: { color: COLORS.error, textAlign: 'center', marginTop: 12, fontSize: 13 },
});
