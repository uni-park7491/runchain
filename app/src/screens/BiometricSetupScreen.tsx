import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as LocalAuthentication from 'expo-local-authentication';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/constants/config';
import { useDispatch } from 'react-redux';
import { finishOnboarding } from '@/store/walletSlice';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BiometricSetup'>;

export default function BiometricSetupScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();
  const [biometricType, setBiometricType] = useState<string | null>(null);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const available = await LocalAuthentication.hasHardwareAsync();
    if (!available) return;
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return;
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      setBiometricType(Platform.OS === 'ios' ? 'Face ID' : '얼굴 인식');
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      setBiometricType(Platform.OS === 'ios' ? 'Touch ID' : '지문 인식');
    }
  };

  const handleEnable = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: '생체인증을 등록합니다',
      cancelLabel: '취소',
    });
    if (result.success) {
      dispatch(finishOnboarding({ useBiometric: true }));
    } else {
      Alert.alert('인증 실패', '생체인증에 실패했습니다. 비밀번호로 이용할 수 있습니다.');
    }
  };

  const handleSkip = () => {
    dispatch(finishOnboarding({ useBiometric: false }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>{biometricType === 'Face ID' ? '🪪' : '👆'}</Text>
        <Text style={styles.title}>
          {biometricType ? `${biometricType} 설정` : '생체인증 설정'}
        </Text>
        <Text style={styles.subtitle}>
          {biometricType
            ? `${biometricType}로 빠르게 잠금 해제하고\n거래를 승인할 수 있습니다`
            : '이 기기는 생체인증을 지원하지 않습니다.\n비밀번호로 이용할 수 있습니다'}
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>🔒 생체인증은 비밀번호를 대체하지 않습니다</Text>
          <Text style={styles.infoText}>🔑 비밀번호가 실제 암호화 키입니다</Text>
          <Text style={styles.infoText}>📱 인증 실패 시 자동으로 비밀번호로 전환</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {biometricType && (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleEnable}>
            <Text style={styles.primaryBtnText}>{biometricType} 사용하기</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipBtnText}>
            {biometricType ? '나중에 설정하기' : '비밀번호로 시작하기'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 64, marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  infoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoText: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  actions: { paddingBottom: 16, gap: 12 },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: 17, fontWeight: '700', color: '#000' },
  skipBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipBtnText: { fontSize: 15, color: COLORS.textSecondary },
});
