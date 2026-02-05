import AsyncStorage from '@react-native-async-storage/async-storage';
import { EncryptionService } from './EncryptionService';

export interface WalletMetadata {
    id: string;
    name: string;
    address: string;
    createdAt: number;
    index?: number;
    parentId?: string;
}

export interface BrowserTab {
    id: string;
    url: string;
    title: string;
    favicon?: string;
    history: string[];
}

export interface SecuritySettings {
    isBiometricsEnabled: boolean;
    autoLockTimeout: number; // in seconds
    clipboardTimeout: number; // in seconds
    screenshotProtection: boolean;
    dappPermissions: Record<string, string[]>; // origin -> permission types
    failedAttempts: number;
    lockoutUntil: number | null; // timestamp
}

export interface NotificationSettings {
    incomingTransactions: boolean;
    outgoingConfirmations: boolean;
    failedTransactions: boolean;
    securityEvents: boolean;
}

export interface AppSettings {
    activeWalletId: string;
    wallets: WalletMetadata[];
    selectedNetworkId: number;
    customRpcMap: Record<number, string[]>;
    lastSyncTimestamp: number;
    security: SecuritySettings;
    notifications: NotificationSettings;
    browserTabs: BrowserTab[];
    browserHistory: { url: string; title: string; timestamp: number }[];
}

const STORAGE_KEYS = {
    SETTINGS: 'stellar_app_settings',
    TX_HISTORY: (walletId: string, chainId: number) => `stellar_tx_history_${walletId}_${chainId}`,
    DAPP_SESSIONS: 'stellar_dapp_sessions',
};

export class StorageService {
    static async getSettings(): Promise<AppSettings | null> {
        try {
            let data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (!data) return null;

            // Decrypt if it looks like an encrypted payload (or just try)
            try {
                data = await EncryptionService.decrypt(data);
            } catch (e) {
                // Fallback for migration if old data was plain text
            }

            try {
                const settings = JSON.parse(data);
                return this.ensureDefaults(settings);
            } catch (e) {
                console.warn('[StorageService] Settings data corrupted or invalid JSON. Reverting to null.');
                return null;
            }
        } catch (error) {
            console.error('Failed to get settings:', error);
            return null;
        }
    }

    private static ensureDefaults(settings: any): AppSettings {
        const defaultSecurity: SecuritySettings = {
            isBiometricsEnabled: false,
            autoLockTimeout: 300,
            clipboardTimeout: 60,
            screenshotProtection: false,
            dappPermissions: {},
            failedAttempts: 0,
            lockoutUntil: null,
        };

        const defaultNotifications: NotificationSettings = {
            incomingTransactions: true,
            outgoingConfirmations: true,
            failedTransactions: true,
            securityEvents: true,
        };

        return {
            ...settings,
            wallets: settings.wallets || [],
            customRpcMap: settings.customRpcMap || {},
            security: { ...defaultSecurity, ...(settings.security || {}) },
            notifications: { ...defaultNotifications, ...(settings.notifications || {}) },
            browserTabs: settings.browserTabs || [],
            browserHistory: settings.browserHistory || [],
        };
    }

    static async saveSettings(settings: AppSettings): Promise<boolean> {
        try {
            const data = JSON.stringify(settings);
            const encryptedData = await EncryptionService.encrypt(data);
            await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, encryptedData);
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    static async addWallet(wallet: WalletMetadata): Promise<void> {
        let settings = await this.getSettings();

        // Defensive initialization
        if (!settings) {
            console.log('[StorageService] Initializing new settings');
            settings = {
                activeWalletId: wallet.id,
                wallets: [],
                selectedNetworkId: 1,
                customRpcMap: {},
                lastSyncTimestamp: Date.now(),
                security: {
                    isBiometricsEnabled: false,
                    autoLockTimeout: 300, // 5 minutes
                    clipboardTimeout: 60, // 1 minute
                    screenshotProtection: false,
                    dappPermissions: {},
                    failedAttempts: 0,
                    lockoutUntil: null,
                },
                notifications: {
                    incomingTransactions: true,
                    outgoingConfirmations: true,
                    failedTransactions: true,
                    securityEvents: true,
                },
                browserTabs: [],
                browserHistory: [],
            };
        }

        // Ensure wallets array exists (defensive if settings object was partially formed)
        if (!settings.wallets) {
            console.warn('[StorageService] Settings found but wallets array missing, fixing...');
            settings.wallets = [];
        }

        settings.wallets.push(wallet);

        // Double check activeWalletId
        if (!settings.activeWalletId) {
            settings.activeWalletId = wallet.id;
        }

        console.log(`[StorageService] Adding wallet: ${wallet.name} (${wallet.address.slice(0, 6)}...)`);
        const success = await this.saveSettings(settings);
        if (!success) {
            throw new Error('Failed to persist wallet data to storage');
        }
    }

    static async updateWallet(walletId: string, updates: Partial<WalletMetadata>): Promise<void> {
        const settings = await this.getSettings();
        if (!settings) return;

        settings.wallets = settings.wallets.map(w =>
            w.id === walletId ? { ...w, ...updates } : w
        );
        await this.saveSettings(settings);
    }

    static async deleteWallet(walletId: string): Promise<void> {
        const settings = await this.getSettings();
        if (!settings) return;

        settings.wallets = settings.wallets.filter(w => w.id !== walletId);
        if (settings.activeWalletId === walletId) {
            settings.activeWalletId = settings.wallets.length > 0 ? settings.wallets[0].id : '';
        }
        await this.saveSettings(settings);
    }

    static async setActiveWallet(walletId: string): Promise<void> {
        const settings = await this.getSettings();
        if (!settings) return;

        if (settings.wallets.find(w => w.id === walletId)) {
            settings.activeWalletId = walletId;
            await this.saveSettings(settings);
        }
    }

    static async getTxHistory(walletId: string, chainId: number): Promise<any[]> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.TX_HISTORY(walletId, chainId));
            return data ? JSON.parse(data) : [];
        } catch (error) {
            return [];
        }
    }

    static async saveTxHistory(walletId: string, chainId: number, history: any[]): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.TX_HISTORY(walletId, chainId), JSON.stringify(history));
        } catch (error) { }
    }

    static async setSelectedNetwork(chainId: number): Promise<void> {
        const settings = await this.getSettings();
        if (!settings) return;
        settings.selectedNetworkId = chainId;
        await this.saveSettings(settings);
    }

    static async getSelectedNetwork(): Promise<number> {
        const settings = await this.getSettings();
        return settings?.selectedNetworkId || 1; // Default to Mainnet
    }

    static async setCustomRpcs(chainId: number, rpcs: string[]): Promise<void> {
        const settings = await this.getSettings();
        if (!settings) return;
        if (!settings.customRpcMap) settings.customRpcMap = {};
        settings.customRpcMap[chainId] = rpcs;
        await this.saveSettings(settings);
    }

    static async getCustomRpcs(chainId: number): Promise<string[]> {
        const settings = await this.getSettings();
        return settings?.customRpcMap?.[chainId] || [];
    }

    // Browser Management
    static async getBrowserState(): Promise<{ tabs: BrowserTab[], history: any[] }> {
        const settings = await this.getSettings();
        return {
            tabs: settings?.browserTabs || [],
            history: settings?.browserHistory || [],
        };
    }

    static async updateBrowserTabs(tabs: BrowserTab[]): Promise<void> {
        const settings = await this.getSettings();
        if (!settings) return;
        settings.browserTabs = tabs;
        await this.saveSettings(settings);
    }

    // Security & Notifications
    static async updateSecuritySettings(updates: Partial<SecuritySettings>): Promise<void> {
        const settings = await this.getSettings();
        if (!settings) return;
        settings.security = { ...settings.security, ...updates };
        await this.saveSettings(settings);
    }

    static async updateNotificationSettings(updates: Partial<NotificationSettings>): Promise<void> {
        const settings = await this.getSettings();
        if (!settings) return;
        settings.notifications = { ...settings.notifications, ...updates };
        await this.saveSettings(settings);
    }
}
