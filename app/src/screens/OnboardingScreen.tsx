import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/constants/config';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>🏃 RunChain</Text>
        <Text style={styles.tagline}>뛰어라. 증명하라. 보상받아라.</Text>
        <Text style={styles.sub}>
          BNB Chain 기반 주간 러닝 챌린지{`\n`}
          스마트컨트랙트가 상금을 자동 분배합니다
        </Text>
      </View>

      <View style={styles.features}>
        {[
          { icon: '💰', text: 'USDT 참가비 · 스마트컨트랙트 자동 분배' },
          { icon: '📍', text: 'GPS + AI 페이스 검증 · 공정한 랭킹' },
          { icon: '🔒', text: '인앱 지갑 · 프라이빗 키 기기 내 보관' },
        ].map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('CreateWallet')}
        >
          <Text style={styles.primaryBtnText}>새 지갑 만들기</Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>
          지갑을 만들면 서비스 이용약관 및{`\n`}개인정보처리방침에 동의하는 것으로 간주됩니다
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24 },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 40, fontWeight: '800', color: COLORS.primary, marginBottom: 12 },
  tagline: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  sub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  features: { marginBottom: 32 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  featureIcon: { fontSize: 22, marginRight: 12 },
  featureText: { fontSize: 14, color: COLORS.textSecondary, flex: 1 },
  actions: { paddingBottom: 16 },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryBtnText: { fontSize: 17, fontWeight: '700', color: '#000' },
  disclaimer: { fontSize: 11, color: '#555', textAlign: 'center', lineHeight: 18 },
});
