import { createStackNavigator } from '@react-navigation/stack';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AddTokenScreen } from '../screens/AddTokenScreen';
import { DAppBrowserScreen } from '../screens/DAppBrowserScreen';
import { SendScreen } from '../screens/SendScreen';
import { TransactionPreviewScreen } from '../screens/TransactionPreviewScreen';
import { ReceiveScreen } from '../screens/ReceiveScreen';
import { WalletManagerScreen } from '../screens/WalletManagerScreen';
import { NetworkSelectorScreen } from '../screens/NetworkSelectorScreen';
import { TransactionHistoryScreen } from '../screens/TransactionHistoryScreen';
import { TransactionDetailsScreen } from '../screens/TransactionDetailsScreen';
import { AssetDetailsScreen } from '../screens/AssetDetailsScreen';
import { SecuritySettingsScreen } from '../screens/SecuritySettingsScreen';
import { SetupPinScreen } from '../screens/SetupPinScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { SwapScreen } from '../screens/SwapScreen';
import { ExportWalletScreen } from '../screens/ExportWalletScreen';
import { CreateWalletScreen } from '../screens/CreateWalletScreen';
import { ImportWalletScreen } from '../screens/ImportWalletScreen';
import { MnemonicDisplayScreen } from '../screens/MnemonicDisplayScreen';
import { MnemonicVerifyScreen } from '../screens/MnemonicVerifyScreen';

import { PinQueryScreen } from '../screens/PinQueryScreen';
import { MainStackParamList } from './types';

const Stack = createStackNavigator<MainStackParamList>();

export const MainNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: '#0D0D0D' },
            }}
        >
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="WalletManager" component={WalletManagerScreen} />
            <Stack.Screen name="NetworkSelector" component={NetworkSelectorScreen} />
            <Stack.Screen name="DAppBrowser" component={DAppBrowserScreen} />
            <Stack.Screen name="Send" component={SendScreen} />
            <Stack.Screen name="Receive" component={ReceiveScreen} />
            <Stack.Screen name="AddToken" component={AddTokenScreen} />
            <Stack.Screen name="TransactionPreview" component={TransactionPreviewScreen} />
            <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
            <Stack.Screen name="TransactionDetails" component={TransactionDetailsScreen} />
            <Stack.Screen name="AssetDetails" component={AssetDetailsScreen} />
            <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
            <Stack.Screen name="SetupPin" component={SetupPinScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Swap" component={SwapScreen} />
            {/* ... (rest of screens) */}
            <Stack.Screen name="ExportWallet" component={ExportWalletScreen} />
            <Stack.Screen name="PinQuery" component={PinQueryScreen} />
            {/* Onboarding Flow from Main */}
            <Stack.Screen name="CreateWallet" component={CreateWalletScreen} />
            <Stack.Screen name="ImportWallet" component={ImportWalletScreen} />
            <Stack.Screen name="MnemonicDisplay" component={MnemonicDisplayScreen} />
            <Stack.Screen name="MnemonicVerify" component={MnemonicVerifyScreen} />
        </Stack.Navigator>
    );
};
