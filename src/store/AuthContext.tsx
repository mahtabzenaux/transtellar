import React, { createContext, useContext, useState, useEffect } from 'react';
import { SecurityService } from '../services/SecurityService';
import { StorageService, WalletMetadata } from '../services/StorageService';
import { WalletService } from '../services/WalletService';
import { SyncManager } from '../services/data/SyncManager';

interface AuthContextType {
    hasWallet: boolean;
    isLocked: boolean;
    isLoading: boolean;
    activeWallet: WalletMetadata | null;
    wallets: WalletMetadata[];
    completeOnboarding: (wallet: WalletMetadata) => Promise<void>;
    lock: () => void;
    unlock: () => void;
    checkWallet: () => Promise<void>;
    onAppBackground: () => void;
    onAppForeground: () => Promise<void>;
    setActiveWallet: (walletId: string) => Promise<void>;
    addWallet: (wallet: WalletMetadata) => Promise<void>;
    removeWallet: (walletId: string) => Promise<void>;
    updateWalletLabel: (walletId: string, newName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [wallets, setWallets] = useState<WalletMetadata[]>([]);
    const [activeWallet, setActiveWalletState] = useState<WalletMetadata | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [backgroundTimestamp, setBackgroundTimestamp] = useState<number | null>(null);

    const checkWallet = async () => {
        setIsLoading(true);
        try {
            const settings = await StorageService.getSettings();

            if (settings && settings.wallets.length > 0) {
                setWallets(settings.wallets);
                // Security Note: We no longer call ensureGlobalAuthExists here 
                // to prevent fingerprint prompts during the splash screen.
                // The Master Lock is enforced by the LockScreen/SecurityService.

                const active = settings.wallets.find(w => w.id === settings.activeWalletId) || settings.wallets[0];
                setActiveWalletState(active);

                // Force lock on initial startup if wallets exist
                if (isLoading) {
                    setIsLocked(true);
                }

                // Add small delay to ensure Activity is assigned on Android
                await new Promise(resolve => setTimeout(resolve, 300));

                // Load the wallet in WalletService
                await WalletService.loadWallet(active.id);

                // Initialize SyncManager
                await SyncManager.init();
                const chainId = WalletService.getChainId();
                const provider = WalletService.getProvider();
                const rpcUrl = (provider as any)._getConnection?.().url || 'https://rpc.sepolia.org';
                await SyncManager.startSync(active.address, chainId, rpcUrl);
            } else {
                setWallets([]);
                setActiveWalletState(null);
            }
        } catch (error) {
            console.error('Failed to check wallet status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const completeOnboarding = async (wallet: WalletMetadata) => {
        await StorageService.addWallet(wallet);
        await checkWallet();
    };

    const setActiveWallet = async (walletId: string) => {
        await StorageService.setActiveWallet(walletId);
        const settings = await StorageService.getSettings();
        if (settings) {
            const active = settings.wallets.find(w => w.id === walletId);
            if (active) {
                setActiveWalletState(active);
                await WalletService.loadWallet(active.id);
            }
        }
    };

    const addWallet = async (wallet: WalletMetadata) => {
        await StorageService.addWallet(wallet);
        await checkWallet();
    };

    const removeWallet = async (walletId: string) => {
        await SecurityService.deleteSecrets(walletId);
        await StorageService.deleteWallet(walletId);
        await checkWallet();
    };

    const updateWalletLabel = async (walletId: string, newName: string) => {
        await StorageService.updateWallet(walletId, { name: newName });
        await checkWallet();
    };

    const lock = () => {
        setIsLocked(true);
    };

    const unlock = () => {
        setIsLocked(false);
        setBackgroundTimestamp(null);
    };

    const onAppBackground = () => {
        setBackgroundTimestamp(Date.now());
    };

    const onAppForeground = async () => {
        if (!backgroundTimestamp || isLocked) return;

        try {
            const settings = await StorageService.getSettings();
            if (settings?.security) {
                const timeoutMs = (settings.security.autoLockTimeout || 30) * 1000;
                const elapsed = Date.now() - backgroundTimestamp;

                if (elapsed >= timeoutMs) {
                    console.log(`[AuthContext] Auto-locking after ${elapsed / 1000}s`);
                    lock();
                }
            }
        } catch (error) {
            console.error('Failed to check auto-lock on foreground:', error);
        }
    };

    useEffect(() => {
        checkWallet();
    }, []);

    return (
        <AuthContext.Provider value={{
            hasWallet: wallets.length > 0,
            isLocked,
            isLoading,
            activeWallet,
            wallets,
            completeOnboarding,
            lock,
            unlock,
            checkWallet,
            setActiveWallet,
            addWallet,
            removeWallet,
            updateWalletLabel,
            onAppBackground,
            onAppForeground
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
