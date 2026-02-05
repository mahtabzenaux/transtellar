import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { CreateWalletScreen } from '../screens/CreateWalletScreen';
import { ImportWalletScreen } from '../screens/ImportWalletScreen';
import { MnemonicDisplayScreen } from '../screens/MnemonicDisplayScreen';
import { MnemonicVerifyScreen } from '../screens/MnemonicVerifyScreen';
import { SetupPinScreen } from '../screens/SetupPinScreen';
import { OnboardingStackParamList } from './types';

const Stack = createStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: '#0D0D0D' },
            }}
        >
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="CreateWallet" component={CreateWalletScreen} />
            <Stack.Screen name="ImportWallet" component={ImportWalletScreen} />
            <Stack.Screen name="MnemonicDisplay" component={MnemonicDisplayScreen} />
            <Stack.Screen name="MnemonicVerify" component={MnemonicVerifyScreen} />
            <Stack.Screen name="SetupPin" component={SetupPinScreen} />
        </Stack.Navigator>
    );
};
