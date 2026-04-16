import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/constants/config';
import { generateMnemonic } from '@/utils/wallet';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CreateWallet'>;

export default function CreateWalletScreen() {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const mnemonic = await generateMnemonic();
      navigation.navigate('MnemonicBackup', { mnemonic });
    } catch (e) {
      Alert.alert('오류', '지갑 생성 중 문제가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← 뒤로</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>BNB Chain 지갑 생성</Text>
        <Text style={styles.subtitle}>
          RunChain 전용 지갑을 만듭니다.{`\n`}
          프라이빗 키는 오직 이 기기에만 저장됩니다.
        </Text>

        <View style={styles.infoBox}>
          {[
            '✅ 프라이빗 키 — 기기 내 AES-256 암호화',
            '✅ 서버에는 절대 저장되지 않음',
            '✅ 12단어 복구 문구로 언제든 복원 가능',
            '⚠️  복구 문구 분실 시 자산 복구 불가',
          ].map((t, i) => (
            <Text key={i} style={styles.infoText}>{t}</Text>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.btnText}>지갑 생성하기</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24 },
  back: { paddingVertical: 8 },
  backText: { color: COLORS.primary, fontSize: 15 },
  content: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 24, marginBottom: 32 },
  infoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoText: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8, lineHeight: 22 },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 17, fontWeight: '700', color: '#000' },
});
