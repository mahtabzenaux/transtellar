import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { THEME } from '../theme/theme';
import { H2, H3, BodySmall, Caption } from '../components/Typography';
import GlassCard from '../components/GlassCard';
import { GothicButton } from '../components/GothicButton';
import { GothicInput } from '../components/GothicInput';
import { Icon } from '../components/Icon';
import { WalletService, NETWORKS } from '../services/WalletService';
import { StorageService } from '../services/StorageService';
import { useAlert } from '../context/AlertContext';

export const NetworkSelectorScreen = ({ navigation }: any) => {
    const { showAlert } = useAlert();
    const [selectedChainId, setSelectedChainId] = useState(WalletService.getChainId());
    const [customRpcs, setCustomRpcs] = useState<Record<number, string[]>>({});
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [newRpcUrl, setNewRpcUrl] = useState('');
    const [targetChainId, setTargetChainId] = useState<number>(1);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const chainId = await StorageService.getSelectedNetwork();
        setSelectedChainId(chainId);

        const settings = await StorageService.getSettings();
        if (settings?.customRpcMap) {
            setCustomRpcs(settings.customRpcMap);
        }
    };

    const handleSelectNetwork = async (chainId: number) => {
        try {
            const success = await WalletService.switchNetwork(chainId);
            if (success) {
                await StorageService.setSelectedNetwork(chainId);
                setSelectedChainId(chainId);
                showAlert('Network Switched', `Successfully connected to chain ${chainId}`);
                navigation.goBack();
            } else {
                showAlert('Error', 'Failed to switch network.');
            }
        } catch (error) {
            showAlert('Error', 'Failed to switch network.');
        }
    };

    const handleAddCustomRpc = async () => {
        if (!newRpcUrl.startsWith('http')) {
            showAlert('Error', 'Invalid RPC URL');
            return;
        }

        const currentCustom = customRpcs[targetChainId] || [];
        const updated = [...currentCustom, newRpcUrl];

        await StorageService.setCustomRpcs(targetChainId, updated);
        setCustomRpcs({ ...customRpcs, [targetChainId]: updated });

        setIsAddModalVisible(false);
        setNewRpcUrl('');
    };

    const renderNetworkItem = ({ item }: { item: any }) => {
        const isActive = selectedChainId === item.chainId;
        const rpcCount = 1 + (customRpcs[item.chainId]?.length || 0);

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleSelectNetwork(item.chainId)}
                style={styles.assetItem}
            >
                <GlassCard style={[styles.networkCard, isActive && styles.activeCard]}>
                    <View style={styles.networkHeader}>
                        <View style={styles.networkIcon}>
                            <Icon name="network" size={20} color={isActive ? THEME.colors.primary : THEME.colors.textSecondary} />
                        </View>
                        <View style={styles.networkInfo}>
                            <H3 style={[styles.networkName, isActive && { color: THEME.colors.primary }] as any}>
                                {item.name}
                            </H3>
                            <Caption>{rpcCount} RPC Endpoint(s)</Caption>
                        </View>
                        {isActive && (
                            <View style={styles.activeBadge}>
                                <Icon name="check" size={14} color={THEME.colors.background} />
                            </View>
                        )}
                    </View>

                    <View style={styles.actions}>
                        <GothicButton
                            title="+ Add RPC"
                            variant="ghost"
                            icon="plus"
                            onPress={() => {
                                setTargetChainId(item.chainId);
                                setIsAddModalVisible(true);
                            }}
                            style={styles.addRpcBtn}
                        />
                    </View>
                </GlassCard>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={THEME.colors.primary} />
                </TouchableOpacity>
                <H2>Networks</H2>
            </View>

            <FlatList
                data={Object.values(NETWORKS)}
                keyExtractor={(item) => item.chainId.toString()}
                renderItem={renderNetworkItem}
                contentContainerStyle={styles.list}
            />

            <Modal
                visible={isAddModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsAddModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.modalContent}>
                        <H2 style={styles.modalTitle}>Add Custom RPC</H2>
                        <BodySmall style={styles.modalSubtitle}>Chain ID: {targetChainId}</BodySmall>

                        <GothicInput
                            label="RPC URL"
                            placeholder="https://your-rpc-url.com"
                            value={newRpcUrl}
                            onChangeText={setNewRpcUrl}
                            autoCapitalize="none"
                        />

                        <View style={styles.modalActions}>
                            <GothicButton
                                title="Cancel"
                                variant="outline"
                                onPress={() => setIsAddModalVisible(false)}
                                style={styles.modalBtn}
                            />
                            <GothicButton
                                title="Confirm"
                                onPress={handleAddCustomRpc}
                                style={styles.modalBtn}
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
    networkCard: {
        padding: THEME.spacing.lg,
    },
    activeCard: {
        borderColor: THEME.colors.primary,
        borderWidth: 1,
    },
    networkHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: THEME.spacing.md,
    },
    networkIcon: {
        width: 44,
        height: 44,
        borderRadius: THEME.radius.md,
        backgroundColor: THEME.colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: THEME.spacing.md,
    },
    networkInfo: {
        flex: 1,
    },
    networkName: {
        fontWeight: '700',
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
    addRpcBtn: {
        height: 40,
        paddingHorizontal: THEME.spacing.md,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        padding: THEME.spacing.xl,
    },
    modalContent: {
        padding: THEME.spacing.xl,
        borderWidth: 1,
        borderColor: THEME.colors.primary,
    },
    modalTitle: {
        textAlign: 'center',
        marginBottom: THEME.spacing.xs,
    },
    modalSubtitle: {
        textAlign: 'center',
        color: THEME.colors.textSecondary,
        marginBottom: THEME.spacing.xl,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: THEME.spacing.md,
    },
    modalBtn: {
        flex: 0.48,
    },
});
