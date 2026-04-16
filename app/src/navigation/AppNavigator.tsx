import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { View, Text, StyleSheet } from 'react-native';

// Screens
import OnboardingScreen from '@/screens/OnboardingScreen';
import CreateWalletScreen from '@/screens/CreateWalletScreen';
import MnemonicBackupScreen from '@/screens/MnemonicBackupScreen';
import SetPasswordScreen from '@/screens/SetPasswordScreen';
import BiometricSetupScreen from '@/screens/BiometricSetupScreen';
import LockScreen from '@/screens/LockScreen';
import HomeScreen from '@/screens/HomeScreen';
import ChallengeListScreen from '@/screens/ChallengeListScreen';
import CreateChallengeScreen from '@/screens/CreateChallengeScreen';
import ChallengeDetailScreen from '@/screens/ChallengeDetailScreen';
import RunningScreen from '@/screens/RunningScreen';
import LeaderboardScreen from '@/screens/LeaderboardScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import WalletScreen from '@/screens/WalletScreen';
import TreasuryScreen from '@/screens/TreasuryScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  CreateWallet: undefined;
  MnemonicBackup: { mnemonic: string };
  SetPassword: undefined;
  BiometricSetup: undefined;
  Lock: undefined;
  Main: undefined;
  ChallengeDetail: { challengeId: number };
  CreateChallenge: undefined;
  Running: { challengeId: number };
  Leaderboard: { challengeId: number };
  Treasury: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Challenges: undefined;
  Profile: undefined;
  Wallet: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Challenges: '🏃',
    Profile: '👤',
    Wallet: '💰',
  };
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
        {icons[name]}
      </Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#00E5A0',
        tabBarInactiveTintColor: '#555',
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: '홈' }} />
      <Tab.Screen name="Challenges" component={ChallengeListScreen} options={{ tabBarLabel: '챌린지' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: '프로필' }} />
      <Tab.Screen name="Wallet" component={WalletScreen} options={{ tabBarLabel: '지갑' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { hasWallet, isLocked } = useSelector((state: RootState) => state.wallet);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasWallet ? (
          // 온보딩 플로우
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="CreateWallet" component={CreateWalletScreen} />
            <Stack.Screen name="MnemonicBackup" component={MnemonicBackupScreen} />
            <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
            <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
          </>
        ) : isLocked ? (
          // 잠금 화면
          <Stack.Screen name="Lock" component={LockScreen} />
        ) : (
          // 메인 앱
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} />
            <Stack.Screen name="CreateChallenge" component={CreateChallengeScreen} />
            <Stack.Screen name="Running" component={RunningScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="Treasury" component={TreasuryScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1A1A1A',
    borderTopColor: '#2A2A2A',
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 16,
  },
  tabIconContainer: {
    alignItems: 'center',
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabIconFocused: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
