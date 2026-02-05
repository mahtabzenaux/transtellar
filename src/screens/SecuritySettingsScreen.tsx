import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch, SafeAreaView } from 'react-native';
import { THEME } from '../theme/theme';
import { H1, H2, H3, Body, BodySmall, Caption } from '../components/Typography';
import { Icon } from '../components/Icon';
import GlassCard from '../components/GlassCard';
import { StorageService, SecuritySettings } from '../services/StorageService';
import { useAuth } from '../store/AuthContext';
import { useAlert } from '../context/AlertContext';
import { SecureWindowModule } from '../modules/SecureWindowModule';
import { SecurityService } from '../services/SecurityService';

export const SecuritySettingsScreen = ({ navigation }: any) => {
    const { lock } = useAuth();
    const { showAlert } = useAlert();
    const [settings, setSettings] = useState<SecuritySettings | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const appSettings = await StorageService.getSettings();
        if (appSettings) {
            setSettings(appSettings.security);
        }
    };

    const toggleBiometrics = async (value: boolean) => {
        if (!value) {
            showAlert('Notice', 'Disabling biometrics here prevents the app from asking, but your device may still require it for Keychain access until you re-import your wallet.');
        }
        if (settings) {
            const updated = { ...settings, isBiometricsEnabled: value };
            setSettings(updated);
            await StorageService.updateSecuritySettings({ isBiometricsEnabled: value });
        }
    };

    const toggleScreenshotProtection = async (value: boolean) => {
        if (settings) {
            const updated = { ...settings, screenshotProtection: value };
            setSettings(updated);
            await StorageService.updateSecuritySettings({ screenshotProtection: value });
            SecureWindowModule.changeSecureWindow(value);
            showAlert('Protection Updated', 'Screenshot and screen recording protection has been updated.');
        }
    };

    const updateAutoLock = async (seconds: number) => {
        if (settings) {
            const updated = { ...settings, autoLockTimeout: seconds };
            setSettings(updated);
            await StorageService.updateSecuritySettings({ autoLockTimeout: seconds });
        }
    };

    const handlePinChange = async () => {
        const hasPin = await SecurityService.hasAuthCredential();
        if (hasPin) {
            navigation.navigate('PinQuery', {
                onSuccess: () => navigation.replace('SetupPin', { isUpdate: true }),
                stayOnSuccess: true
            });
        } else {
            navigation.navigate('SetupPin');
        }
    };

    if (!settings) return null;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color={THEME.colors.text} />
                </TouchableOpacity>
                <H2 style={styles.headerTitle}>Security & Privacy</H2>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Caption style={styles.sectionTitle}>Authentication</Caption>
                    <GlassCard style={styles.card}>
                        <View style={styles.settingItem}>
                            <View>
                                <Body>Biometric Unlock</Body>
                                <BodySmall color={THEME.colors.textSecondary}>Use Fingerprint or FaceID</BodySmall>
                            </View>
                            <Switch
                                value={settings.isBiometricsEnabled}
                                onValueChange={toggleBiometrics}
                                trackColor={{ false: '#333', true: THEME.colors.primary }}
                            />
                        </View>
                        <View style={styles.divider} />
                        <TouchableOpacity style={styles.settingItem} onPress={handlePinChange}>
                            <View>
                                <Body>Change PIN</Body>
                                <BodySmall color={THEME.colors.textSecondary}>Secure 6-digit access code</BodySmall>
                            </View>
                            <Icon name="arrow-right" size={20} color={THEME.colors.textSecondary} />
                        </TouchableOpacity>
                    </GlassCard>
                </View>

                <View style={styles.section}>
                    <Caption style={styles.sectionTitle}>Auto-Lock</Caption>
                    <GlassCard style={styles.card}>
                        {[
                            { label: 'Immediately', value: 0 },
                            { label: '1 Minute', value: 60 },
                            { label: '5 Minutes', value: 300 },
                            { label: '1 Hour', value: 3600 },
                        ].map((option, index) => (
                            <React.Fragment key={option.value}>
                                <TouchableOpacity
                                    style={styles.settingItem}
                                    onPress={() => updateAutoLock(option.value)}
                                >
                                    <Body>{option.label}</Body>
                                    {settings.autoLockTimeout === option.value && (
                                        <Icon name="check" size={20} color={THEME.colors.primary} />
                                    )}
                                </TouchableOpacity>
                                {index < 3 && <View style={styles.divider} />}
                            </React.Fragment>
                        ))}
                    </GlassCard>
                </View>

                <View style={styles.section}>
                    <Caption style={styles.sectionTitle}>Privacy</Caption>
                    <GlassCard style={styles.card}>
                        <View style={styles.settingItem}>
                            <View style={{ flex: 1 }}>
                                <Body>Screenshot Protection</Body>
                                <BodySmall color={THEME.colors.textSecondary}>Prevent screenshots and recording of the app</BodySmall>
                            </View>
                            <Switch
                                value={settings.screenshotProtection}
                                onValueChange={toggleScreenshotProtection}
                                trackColor={{ false: '#333', true: THEME.colors.primary }}
                            />
                        </View>
                    </GlassCard>
                </View>

                <View style={styles.section}>
                    <Caption style={styles.sectionTitle}>Data & Recovery</Caption>
                    <GlassCard style={styles.card}>
                        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('ExportWallet')}>
                            <View>
                                <Body style={{ color: THEME.colors.error }}>Export Wallet Secrets</Body>
                                <BodySmall color={THEME.colors.textSecondary}>View Recovery Phrase & Private Key</BodySmall>
                            </View>
                            <Icon name="arrow-right" size={20} color={THEME.colors.textSecondary} />
                        </TouchableOpacity>
                    </GlassCard>
                </View>

                <TouchableOpacity style={styles.dangerButton} onPress={lock}>
                    <Icon name="shield" size={20} color={THEME.colors.error} />
                    <Body style={{ color: THEME.colors.error, marginLeft: 8 }}>Lock Wallet Now</Body>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: THEME.spacing.lg,
        paddingVertical: THEME.spacing.lg,
    },
    headerTitle: {
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: THEME.spacing.lg,
        paddingBottom: THEME.spacing.xxl,
    },
    section: {
        marginBottom: THEME.spacing.lg,
    },
    sectionTitle: {
        marginBottom: THEME.spacing.sm,
        marginLeft: THEME.spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        padding: THEME.spacing.sm,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: THEME.spacing.md,
    },
    divider: {
        height: 1,
        backgroundColor: THEME.colors.border,
        marginHorizontal: THEME.spacing.md,
    },
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: THEME.spacing.xxl,
        padding: THEME.spacing.md,
        borderRadius: THEME.radius.md,
        borderWidth: 1,
        borderColor: THEME.colors.error + '44',
    }
});
