import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/constants/config';
import * as Clipboard from 'expo-clipboard';

type Nav = NativeStackNavigationProp<RootStackParamList, 'MnemonicBackup'>;
type Route = RouteProp<RootStackParamList, 'MnemonicBackup'>;

export default function MnemonicBackupScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { mnemonic } = route.params;
  const words = mnemonic.split(' ');
  const [confirmed, setConfirmed] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(mnemonic);
    Alert.alert('복사됨', '안전한 곳에 보관하세요. 스크린샷은 위험합니다.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🔑 복구 문구 백업</Text>
      <Text style={styles.subtitle}>
        아래 12단어를 순서대로 안전한 곳에 적어두세요.{`\n`}
        이 문구를 잃으면 지갑을 복구할 수 없습니다.
      </Text>

      <View style={styles.warningBox}>
        <Text style={styles.warningText}>⚠️  절대 타인에게 공유하지 마세요</Text>
        <Text style={styles.warningText}>⚠️  스크린샷 저장은 권장하지 않습니다</Text>
      </View>

      <View style={styles.wordsGrid}>
        {words.map((word, i) => (
          <View key={i} style={styles.wordCard}>
            <Text style={styles.wordNum}>{i + 1}</Text>
            <Text style={styles.word}>{word}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
        <Text style={styles.copyBtnText}>📋 클립보드에 복사</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.checkRow}
        onPress={() => setConfirmed(!confirmed)}
      >
        <Text style={styles.checkbox}>{confirmed ? '☑️' : '☐'}</Text>
        <Text style={styles.checkText}>12단어를 안전한 곳에 적어두었습니다</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.nextBtn, !confirmed && styles.btnDisabled]}
        disabled={!confirmed}
        onPress={() => navigation.navigate('SetPassword')}
      >
        <Text style={styles.nextBtnText}>다음 단계 →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 20 },
  warningBox: {
    backgroundColor: '#2A1A00',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  warningText: { color: COLORS.warning, fontSize: 13, marginBottom: 4 },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  wordCard: {
    width: '30%',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  wordNum: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 2 },
  word: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  copyBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  copyBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  checkbox: { fontSize: 22, marginRight: 10 },
  checkText: { fontSize: 14, color: COLORS.textSecondary, flex: 1 },
  nextBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.3 },
  nextBtnText: { fontSize: 17, fontWeight: '700', color: '#000' },
});
