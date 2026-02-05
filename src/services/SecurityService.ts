import * as Keychain from 'react-native-keychain';
import { StorageService } from './StorageService';
import DeviceInfo from 'react-native-device-info';
import { isRootDetected } from 'react-native-root-detection';

const BASE_WALLET_SERVICE = 'com.web3wallet.wallet';
const PIN_SERVICE = 'com.web3wallet.auth';
const GLOBAL_LOCK_SERVICE = 'com.web3wallet.global_lock';
const WALLET_KEY_USERNAME = 'wallet_master_key';
const AUTH_KEY_USERNAME = 'auth_secret';
const GLOBAL_LOCK_KEY_USERNAME = 'global_lock_secret';

// Security Hardening: Strip logs in production
if (!__DEV__) {
    (console as any).log = () => { };
    (console as any).info = () => { };
    (console as any).warn = () => { };
    (console as any).debug = () => { };
    // error logs might be kept for crash reporting in a real setup, but stripped here for maximum hardening as requested
    (console as any).error = () => { };
}

export interface WalletSecrets {
    privateKey: string;
    mnemonic: string;
}

export class SecurityService {
    /**
     * Get unique service name for a specific wallet ID
     */
    private static getWalletService(walletId: string): string {
        return `${BASE_WALLET_SERVICE}.${walletId}`;
    }

    /**
     * Store wallet secrets for a specific wallet ID
     */
    static async storeSecrets(walletId: string, privateKey: string, mnemonic: string): Promise<boolean> {
        const secrets: WalletSecrets = { privateKey, mnemonic };
        const password = JSON.stringify(secrets);

        try {
            await Keychain.setGenericPassword(WALLET_KEY_USERNAME, password, {
                service: this.getWalletService(walletId),
                // Try with biometrics first, but fall back to passcode/unlocked if needed
                accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
                accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
            });
            return true;
        } catch (error: any) {
            console.warn('[SecurityService] Biometric storage failed, trying standard encryption...', error);
            try {
                // Fallback to standard encryption if biometrics/passcode-set-only fails
                await Keychain.setGenericPassword(WALLET_KEY_USERNAME, password, {
                    service: this.getWalletService(walletId),
                    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
                });
                return true;
            } catch (fallbackError) {
                console.error('[SecurityService] Fatal storage failure:', fallbackError);
                return false;
            }
        }
    }

    /**
     * Retrieve wallet secrets after biometric or device authentication
     */
    static async getSecrets(walletId: string): Promise<WalletSecrets | null> {
        try {
            const credentials = await Keychain.getGenericPassword({
                service: this.getWalletService(walletId),
                authenticationPrompt: {
                    title: 'Authorize Access',
                    subtitle: 'Authenticate to access your wallet keys',
                    description: 'This is required for signing.',
                    cancel: 'Cancel',
                },
            });

            if (credentials) {
                return JSON.parse(credentials.password) as WalletSecrets;
            }
            console.warn('[SecurityService] No credentials found for service:', this.getWalletService(walletId));
            return null;
        } catch (error) {
            console.error('[SecurityService] Failed to retrieve secrets:', error);
            return null;
        }
    }

    /**
     * Check if secrets exist for a specific wallet ID
     */
    static async hasWallet(walletId: string): Promise<boolean> {
        try {
            const credentials = await Keychain.getGenericPassword({
                service: this.getWalletService(walletId),
            });
            return !!credentials;
        } catch (error) {
            return false;
        }
    }

    /**
     * Delete secrets for a specific wallet ID
     */
    static async deleteSecrets(walletId: string): Promise<boolean> {
        try {
            await Keychain.resetGenericPassword({
                service: this.getWalletService(walletId),
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * PIN/Password Management
     */
    static async setAuthCredential(pinOrPassword: string): Promise<boolean> {
        try {
            await Keychain.setGenericPassword(AUTH_KEY_USERNAME, pinOrPassword, {
                service: PIN_SERVICE,
                accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            });
            return true;
        } catch (error) {
            console.warn('[SecurityService] Failed to set auth credential with strict security, trying fallback...', error);
            try {
                // Fallback for emulators or devices without secure lock screen
                await Keychain.setGenericPassword(AUTH_KEY_USERNAME, pinOrPassword, {
                    service: PIN_SERVICE,
                    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
                });
                console.log('[SecurityService] Auth credential set with fallback security.');
                return true;
            } catch (fallbackError) {
                console.error('[SecurityService] Fatal: Failed to set auth credential:', fallbackError);
                return false;
            }
        }
    }

    static async verifyAuthCredential(pin: string): Promise<boolean> {
        // First check if we are locked out
        const lockout = await this.checkLockout();
        if (lockout.isLocked) {
            console.warn(`[SecurityService] Auth attempt blocked. Locked out for ${lockout.remaining}s`);
            return false;
        }

        try {
            const credentials = await Keychain.getGenericPassword({
                service: PIN_SERVICE,
            });
            const success = credentials && credentials.password === pin;

            if (success) {
                await this.resetFailedAttempts();
                return true;
            } else {
                await this.recordFailedAttempt();
                return false;
            }
        } catch (error) {
            console.error('Credential verification failed:', error);
            return false;
        }
    }

    static async checkLockout(): Promise<{ isLocked: boolean; remaining: number }> {
        const settings = await StorageService.getSettings();
        if (!settings?.security.lockoutUntil) return { isLocked: false, remaining: 0 };

        const now = Date.now();
        const diff = settings.security.lockoutUntil - now;

        if (diff > 0) {
            return { isLocked: true, remaining: Math.ceil(diff / 1000) };
        }

        return { isLocked: false, remaining: 0 };
    }

    private static async recordFailedAttempt() {
        const settings = await StorageService.getSettings();
        if (!settings) return;

        const attempts = (settings.security.failedAttempts || 0) + 1;
        let lockoutUntil: number | null = null;

        // Exponential backoff after 5 attempts
        if (attempts >= 20) { lockoutUntil = Date.now() + 3600000; } // 1 hour
        else if (attempts >= 15) { lockoutUntil = Date.now() + 1800000; } // 30 mins
        else if (attempts >= 10) { lockoutUntil = Date.now() + 900000; } // 15 mins
        else if (attempts >= 5) { lockoutUntil = Date.now() + 300000; } // 5 mins
        else if (attempts >= 3) { lockoutUntil = Date.now() + 60000; } // 1 min

        await StorageService.updateSecuritySettings({
            failedAttempts: attempts,
            lockoutUntil
        });
    }

    private static async resetFailedAttempts() {
        await StorageService.updateSecuritySettings({
            failedAttempts: 0,
            lockoutUntil: null
        });
    }

    static async hasAuthCredential(): Promise<boolean> {
        try {
            const credentials = await Keychain.getGenericPassword({
                service: PIN_SERVICE,
            });
            return !!credentials;
        } catch (error) {
            return false;
        }
    }

    /**
     * Global Lock Management - Forces biometric/device prompt
     */
    static async ensureGlobalAuthExists(): Promise<boolean> {
        try {
            const hasGlobal = await Keychain.getGenericPassword({ service: GLOBAL_LOCK_SERVICE });
            if (hasGlobal) return true;

            await Keychain.setGenericPassword(GLOBAL_LOCK_KEY_USERNAME, 'stellar_locked_vault', {
                service: GLOBAL_LOCK_SERVICE,
                accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
                accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
            });
            return true;
        } catch (error) {
            console.warn('[SecurityService] Failed to set global auth key (expected on some emulators):', error);
            return false;
        }
    }

    static async authenticateGlobally(): Promise<boolean> {
        try {
            const credentials = await Keychain.getGenericPassword({
                service: GLOBAL_LOCK_SERVICE,
                authenticationPrompt: {
                    title: 'Unlock Vault',
                    subtitle: 'Authentication required for access',
                    description: 'Unlock your secure vault to continue.',
                    cancel: 'Cancel',
                },
            });
            return !!credentials;
        } catch (error) {
            console.error('[SecurityService] Global authentication failed:', error);
            return false;
        }
    }

    /**
     * Runtime Health Checks
     */
    static async isEnvironmentSecure(): Promise<{ isSecure: boolean; reason?: string }> {
        try {
            // isRooted is often unavailable in newer type defs without jail-monkey
            // getTags frequently reveals test-keys on rooted/custom devices
            const tags = await DeviceInfo.getTags();
            const isCompromised = tags.includes('test-keys');

            if (isCompromised) return { isSecure: false, reason: 'Device environment compromised (test-keys)' };

            const isEmulated = await DeviceInfo.isEmulator();
            if (isEmulated && !__DEV__) return { isSecure: false, reason: 'Enviroment is an emulator' };

            return { isSecure: true };
        } catch (error) {
            return { isSecure: true }; // Fallback to safe
        }
    }
}
