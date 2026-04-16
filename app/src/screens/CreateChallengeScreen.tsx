import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { COLORS, PRIZE_DISTRIBUTION } from '@/constants/config';
import { ContractService } from '@/services/ContractService';

export default function CreateChallengeScreen() {
  const navigation = useNavigation();
  const { address } = useSelector((s: RootState) => s.wallet);
  const [name, setName] = useState('');
  const [fee, setFee] = useState('');
  const [loading, setLoading] = useState(false);

  const feeNum = parseFloat(fee) || 0;
  const prize1 = (feeNum * PRIZE_DISTRIBUTION.RANK_1).toFixed(2);
  const prize2 = (feeNum * PRIZE_DISTRIBUTION.RANK_2).toFixed(2);
  const prize3 = (feeNum * PRIZE_DISTRIBUTION.RANK_3).toFixed(2);

  const isValid = name.trim().length > 0 && feeNum >= 1;

  const handleCreate = async () => {
    if (!isValid || !address) return;
    setLoading(true);
    try {
      const contractService = new ContractService();
      const challengeId = await contractService.createChallenge(name.trim(), feeNum);
      Alert.alert(
        '챌린지 생성 완료',
        `#${challengeId} 챌린지가 만들어졌어요!`,
        [{ text: '확인', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert('오류', e.message || '챌린지 생성에 실패했어요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← 뒤로</Text>
      </TouchableOpacity>

      <Text style={styles.title}>챌린지 만들기</Text>

      <Text style={styles.label}>챌린지 이름</Text>
      <TextInput
        style={styles.input}
        placeholder="예) 서울 러너즈 클럽"
        placeholderTextColor="#555"
        value={name}
        onChangeText={setName}
        maxLength={30}
      />

      <Text style={styles.label}>참가비 (USDT)</Text>
      <TextInput
        style={styles.input}
        placeholder="최소 1 USDT"
        placeholderTextColor="#555"
        value={fee}
        onChangeText={setFee}
        keyboardType="decimal-pad"
      />

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>📌 채린지 조건 (고정)</Text>
        {[
          ['기간', '7일 고정'],
          ['정원', '최대 30명'],
          ['하루 인정', '3km ~ 10km'],
          ['랙킹', '주간 누적 거리'],
        ].map(([k, v]) => (
          <View key={k} style={styles.infoRow}>
            <Text style={styles.infoKey}>{k}</Text>
            <Text style={styles.infoVal}>{v}</Text>
          </View>
        ))}
      </View>

      {feeNum >= 1 && (
        <View style={styles.prizeBox}>
          <Text style={styles.prizeTitle}>🏆 1인 기준 추정 상금</Text>
          <Text style={styles.prizeNote}>(상금은 전체 모집 인원 기준 자동 계산)</Text>
          {[
            ['🥇 1등 50%', `${prize1} USDT`],
            ['🥈 2등 35%', `${prize2} USDT`],
            ['🥉 3등 15%', `${prize3} USDT`],
          ].map(([rank, amount]) => (
            <View key={rank} style={styles.prizeRow}>
              <Text style={styles.prizeRank}>{rank}</Text>
              <Text style={styles.prizeAmount}>{amount}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.btn, !isValid && styles.btnDisabled]}
        onPress={handleCreate}
        disabled={!isValid || loading}
      >
        {loading
          ? <ActivityIndicator color="#000" />
          : <Text style={styles.btnText}>생성 및 USDT 결제</Text>}
      </TouchableOpacity>
      <Text style={styles.hint}>생성 시 지갑에서 USDT가 스마트컨트랙트로 자동 입금됩니다</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 40 },
  back: { paddingVertical: 8, marginBottom: 8 },
  backText: { color: COLORS.primary, fontSize: 15 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 24 },
  label: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: COLORS.surface, borderRadius: 12,
    padding: 16, fontSize: 16, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border,
  },
  infoBox: {
    backgroundColor: COLORS.surface, borderRadius: 14,
    padding: 16, marginTop: 24,
    borderWidth: 1, borderColor: COLORS.border,
  },
  infoTitle: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoKey: { color: COLORS.textSecondary, fontSize: 14 },
  infoVal: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  prizeBox: {
    backgroundColor: '#0D2E1F', borderRadius: 14,
    padding: 16, marginTop: 16,
    borderWidth: 1, borderColor: COLORS.primary,
  },
  prizeTitle: { color: COLORS.primary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  prizeNote: { color: COLORS.textSecondary, fontSize: 11, marginBottom: 12 },
  prizeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  prizeRank: { color: COLORS.text, fontSize: 14 },
  prizeAmount: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 28,
  },
  btnDisabled: { opacity: 0.3 },
  btnText: { fontSize: 17, fontWeight: '700', color: '#000' },
  hint: { color: COLORS.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 10 },
});
