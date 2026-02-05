import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

export type RootStackParamList = {
    Onboarding: undefined;
    Main: undefined;
};

import { WalletMetadata } from '../services/StorageService';

export type OnboardingStackParamList = {
    Welcome: undefined;
    CreateWallet: undefined;
    ImportWallet: undefined;
    MnemonicDisplay: { mnemonic: string; address: string; walletId: string };
    MnemonicVerify: { mnemonic: string; address: string; walletId: string };
    SetupPin: { wallet: WalletMetadata };
};

export type MainStackParamList = {
    Dashboard: undefined;
    WalletManager: undefined;
    NetworkSelector: undefined;
    Receive: undefined;
    Send: { asset?: any };
    AddToken: undefined;
    TransactionHistory: undefined;
    TransactionDetails: { txHash: string };
    TransactionPreview: { txData: any; asset?: any; transferAmount?: string };
    DAppBrowser: { url?: string };
    Settings: undefined;
    SecuritySettings: undefined;
    AssetsInfo: undefined;
    AssetDetails: { asset: any };
    SetupPin: { isUpdate?: boolean };
    Notifications: undefined;
    Swap: undefined;
    ExportWallet: undefined;
    PinQuery: { onSuccess?: () => void, onCancel?: () => void };
    // Onboarding screens accessible from Main
    CreateWallet: undefined;
    ImportWallet: undefined;
    MnemonicDisplay: { mnemonic: string; address: string; walletId: string };
    MnemonicVerify: { mnemonic: string; address: string; walletId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

// We will implement individual navigators in separate files
// For now, let's just create the types
