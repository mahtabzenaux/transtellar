import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { THEME } from '../theme/theme';
import { H2, H3, Body, BodySmall, Caption } from '../components/Typography';
import GlassCard from '../components/GlassCard';
import { GothicButton } from '../components/GothicButton';
import { Icon } from '../components/Icon';
import { useAuth } from '../store/AuthContext';
import { useAlert } from '../context/AlertContext';
import { WalletMetadata } from '../services/StorageService';
import { SecurityService } from '../services/SecurityService';
import { WalletService } from '../services/WalletService';
import Clipboard from '@react-native-clipboard/clipboard';

export const WalletManagerScreen = ({ navigation }: any) => {
    const { wallets, activeWallet, setActiveWallet, removeWallet, addWallet, updateWalletLabel } = useAuth();
    const { showAlert } = useAlert();
    const [isProcessing, setIsProcessing] = useState(false);
    const [renamingWallet, setRenamingWallet] = useState<WalletMetadata | null>(null);
    const [newName, setNewName] = useState('');

    const handleSwitchWallet = async (wallet: WalletMetadata) => {
        if (activeWallet?.id === wallet.id) return;
        setIsProcessing(true);
        try {
            await setActiveWallet(wallet.id);
            navigation.navigate('Dashboard');
        } catch (error) {
            showAlert('Error', 'Failed to switch wallet.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemoveWallet = (walletId: string) => {
        if (wallets.length <= 1) {
            showAlert('Cannot Remove', 'You must have at least one wallet.');
            return;
        }

        showAlert(
            'Delete Wallet',
            'Are you sure? This will remove the wallet from this device. Ensure you have your recovery phrase.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await removeWallet(walletId);
                    }
                }
            ]
        );
    };

    const handleCopyAddress = (address: string) => {
        Clipboard.setString(address);
        // Haptic feedback could be added here
    };

    const handleRename = (wallet: WalletMetadata) => {
        setRenamingWallet(wallet);
        setNewName(wallet.name);
    };

    const confirmRename = async () => {
        if (!renamingWallet || !newName.trim()) return;
        try {
            await updateWalletLabel(renamingWallet.id, newName.trim());
            setRenamingWallet(null);
        } catch (error) {
            showAlert('Error', 'Failed to update name.');
        }
    };

    const renderItem = ({ item }: { item: WalletMetadata }) => {
        const isActive = activeWallet?.id === item.id;
        const dependents = wallets.filter(w => w.parentId === item.id);

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleSwitchWallet(item)}
                style={styles.assetItem}
            >
                <GlassCard style={[styles.walletCard, isActive && styles.activeCard] as any}>
                    <View style={styles.walletHeader}>
                        <View style={styles.walletIcon}>
                            <Icon name="wallet" size={20} color={isActive ? THEME.colors.primary : THEME.colors.textSecondary} />
                        </View>
                        <View style={styles.walletInfo}>
                            <H3 style={[styles.walletName, isActive && { color: THEME.colors.primary }] as any}>
                                {item.name}
                            </H3>
                            <BodySmall style={styles.addressText}>{item.address.slice(0, 10)}...{item.address.slice(-8)}</BodySmall>
                        </View>
                        {isActive && (
                            <View style={styles.activeBadge}>
                                <Icon name="check" size={14} color={THEME.colors.background} />
                            </View>
                        )}
                    </View>

                    <View style={styles.actions}>
                        <GothicButton
                            title="Rename"
                            variant="ghost"
                            icon="settings"
                            onPress={() => handleRename(item)}
                            style={styles.actionBtn}
                        />
                        <GothicButton
                            title="Copy"
                            variant="ghost"
                            icon="copy"
                            onPress={() => handleCopyAddress(item.address)}
                            style={styles.actionBtn}
                        />
                        {!isActive && (
                            <GothicButton
                                title="Delete"
                                variant="ghost"
                                icon="close"
                                onPress={() => handleRemoveWallet(item.id)}
                                style={styles.actionBtn}
                                textStyle={{ color: THEME.colors.error }}
                            />
                        )}
                    </View>
                </GlassCard>

                {dependents.length > 0 && (
                    <View style={styles.dependentsContainer}>
                        {dependents.map(dep => (
                            <TouchableOpacity
                                key={dep.id}
                                activeOpacity={0.7}
                                onPress={() => handleSwitchWallet(dep)}
                                style={styles.dependentItem}
                            >
                                <GlassCard style={[styles.dependentCard, activeWallet?.id === dep.id && styles.activeCard] as any}>
                                    <View style={styles.walletHeader}>
                                        <View style={styles.dependentIcon}>
                                            <Icon name="arrow-right" size={14} color={activeWallet?.id === dep.id ? THEME.colors.primary : THEME.colors.textSecondary} />
                                        </View>
                                        <View style={styles.walletInfo}>
                                            <Body style={[styles.walletName, activeWallet?.id === dep.id && { color: THEME.colors.primary }] as any}>
                                                {dep.name}
                                            </Body>
                                            <Caption style={styles.addressText}>{dep.address.slice(0, 10)}...{dep.address.slice(-8)}</Caption>
                                        </View>
                                        <View style={styles.dependentActions}>
                                            <TouchableOpacity onPress={() => handleRename(dep)} style={styles.depSmallBtn}>
                                                <Icon name="settings" size={16} color={THEME.colors.textSecondary} />
                                            </TouchableOpacity>
                                            {activeWallet?.id !== dep.id && (
                                                <TouchableOpacity onPress={() => handleRemoveWallet(dep.id)} style={styles.depSmallBtn}>
                                                    <Icon name="close" size={16} color={THEME.colors.error} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                </GlassCard>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const handleDeriveAccount = async () => {
        if (!activeWallet) return;
        setIsProcessing(true);
        try {
            const secrets = await SecurityService.getSecrets(activeWallet.id);
            if (!secrets || !secrets.mnemonic) {
                showAlert('Error', 'Recovery phrase not found for this wallet.');
                return;
            }

            const indices = wallets.map(w => w.index || 0);
            const nextIndex = Math.max(...indices) + 1;

            const walletId = `wallet_${Date.now()}`;
            const address = await WalletService.importFromMnemonic(secrets.mnemonic, walletId, nextIndex);

            if (address) {
                const newWallet: WalletMetadata = {
                    id: walletId,
                    name: `Account ${nextIndex + 1}`,
                    address,
                    createdAt: Date.now(),
                    index: nextIndex,
                    parentId: activeWallet.id
                };
                await addWallet(newWallet);
                showAlert('Success', `${newWallet.name} derived from ${activeWallet.name}.`);
            }
        } catch (error) {
            console.error('Failed to derive account:', error);
            showAlert('Error', 'Failed to derive new account.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddWallet = () => {
        showAlert(
            'Add Wallet',
            'Would you like to start a new Master Wallet or add an Account derived from your active seed?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'New Account', // Dependent account
                    onPress: handleDeriveAccount
                },
                {
                    text: 'Master Wallet', // New root
                    onPress: () => {
                        showAlert(
                            'Master Wallet',
                            'Select how you want to add this new Master Wallet:',
                            [
                                { text: 'Create New', onPress: () => navigation.navigate('CreateWallet') },
                                { text: 'Restore Seeds', onPress: () => navigation.navigate('ImportWallet') },
                                { text: 'Back', style: 'cancel' }
                            ]
                        );
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={THEME.colors.primary} />
                </TouchableOpacity>
                <H2>Your Wallets</H2>
            </View>

            {isProcessing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={THEME.colors.primary} />
                    <Body style={styles.processingText}>Switching Wallet...</Body>
                </View>
            ) : (
                <FlatList
                    data={wallets.filter(w => !w.parentId)} // Only root wallets at top level
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListFooterComponent={
                        <GothicButton
                            title="+ Add New Wallet"
                            variant="outline"
                            onPress={handleAddWallet}
                            style={styles.addButton}
                        />
                    }
                />
            )}

            <Modal
                visible={!!renamingWallet}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setRenamingWallet(null)}
            >
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.modalContent}>
                        <H3 style={{ marginBottom: THEME.spacing.md }}>Rename Wallet</H3>
                        <TextInput
                            style={styles.input}
                            value={newName}
                            onChangeText={setNewName}
                            placeholder="Enter wallet name"
                            placeholderTextColor={THEME.colors.textSecondary}
                            autoFocus
                        />
                        <View style={styles.modalActions}>
                            <GothicButton
                                title="Cancel"
                                variant="ghost"
                                onPress={() => setRenamingWallet(null)}
                                style={{ flex: 1 }}
                            />
                            <GothicButton
                                title="Save"
                                variant="primary"
                                onPress={confirmRename}
                                style={{ flex: 1, marginLeft: THEME.spacing.md }}
                            />
                        </View>
                    </GlassCard>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: THEME.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        marginRight: THEME.spacing.md,
    },
    list: {
        padding: THEME.spacing.lg,
    },
    assetItem: {
        marginBottom: THEME.spacing.md,
    },
    walletCard: {
        padding: THEME.spacing.lg,
    },
    activeCard: {
        borderColor: THEME.colors.primary,
        borderWidth: 1,
    },
    walletHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: THEME.spacing.md,
    },
    walletIcon: {
        width: 44,
        height: 44,
        borderRadius: THEME.radius.md,
        backgroundColor: THEME.colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: THEME.spacing.md,
    },
    walletInfo: {
        flex: 1,
    },
    walletName: {
        fontWeight: '700',
    },
    addressText: {
        color: THEME.colors.textSecondary,
        fontFamily: 'monospace',
    },
    activeBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: THEME.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: THEME.colors.border,
        paddingTop: THEME.spacing.sm,
    },
    actionBtn: {
        height: 40,
        paddingHorizontal: THEME.spacing.md,
    },
    addButton: {
        marginTop: THEME.spacing.xl,
    },
    processingText: {
        marginTop: THEME.spacing.md,
        color: THEME.colors.primary,
    },
    dependentsContainer: {
        paddingLeft: THEME.spacing.xl,
        marginTop: 4,
    },
    dependentItem: {
        marginBottom: THEME.spacing.xs,
    },
    dependentCard: {
        padding: THEME.spacing.md,
        backgroundColor: 'rgba(230, 194, 0, 0.03)',
    },
    dependentIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: THEME.spacing.md,
    },
    dependentActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    depSmallBtn: {
        padding: 8,
        marginLeft: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: THEME.spacing.xl,
    },
    modalContent: {
        width: '100%',
        padding: THEME.spacing.xl,
    },
    modalActions: {
        flexDirection: 'row',
        marginTop: THEME.spacing.xl,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: THEME.radius.md,
        padding: THEME.spacing.md,
        color: THEME.colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: THEME.colors.border,
    }
});
