import React, { useEffect, useRef } from 'react';
import { StatusBar, StyleSheet, View, ActivityIndicator, AppState, AppStateStatus, LogBox, Alert } from 'react-native';
import { SecurityService } from './src/services/SecurityService';
import { NavigationContainer } from '@react-navigation/native';
import { OnboardingNavigator } from './src/navigation/OnboardingNavigator';
import { MainNavigator } from './src/navigation/MainNavigator';
import { THEME } from './src/theme/theme';
import { AuthProvider, useAuth } from './src/store/AuthContext';
import { LockScreen } from './src/screens/LockScreen';
import { NotificationService } from './src/services/NotificationService';
import { AlertProvider } from './src/context/AlertContext';
import { AnimatedSplashScreen } from './src/components/AnimatedSplashScreen';

const RootContent = () => {
  const { hasWallet, isLocked, isLoading, onAppBackground, onAppForeground } = useAuth();
  const [splashComplete, setSplashComplete] = React.useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Initialize notification service
    NotificationService.init();

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        onAppBackground();
      } else if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        onAppForeground();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [onAppBackground, onAppForeground]);

  // Show splash if loading OR if splash is still running
  if (!splashComplete) {
    return <AnimatedSplashScreen onAnimationComplete={() => setSplashComplete(true)} />;
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  if (isLocked && hasWallet) {
    return <LockScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.background} />
      {hasWallet ? <MainNavigator /> : <OnboardingNavigator />}
    </NavigationContainer>
  );
};

const App = () => {
  useEffect(() => {
    LogBox.ignoreLogs([
      'Non-serializable values were found in the navigation state',
      'InteractionManager has been deprecated',
      'SafeAreaView has been deprecated',
    ]);

    // Production Security Hardening: Check environment health
    const checkEnvironment = async () => {
      const { isSecure, reason } = await SecurityService.isEnvironmentSecure();
      if (!isSecure) {
        Alert.alert(
          'Security Risk Detected',
          `Your device environment may be compromised: ${reason}. Accessing your wallet from a rooted or emulated device is highly discouraged for security reasons.`,
          [{ text: 'I Understand', style: 'destructive' }],
          { cancelable: false }
        );
      }
    };

    checkEnvironment();
  }, []);

  console.log('App is loaded');
  return (
    <AuthProvider>
      <AlertProvider>
        {/* <Text style={{ color: 'red', fontSize: 20, marginTop: 50 }}>App</Text> */}
        <RootContent />
      </AlertProvider>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
