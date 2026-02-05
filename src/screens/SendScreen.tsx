import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { ethers } from 'ethers';
import { THEME } from '../theme/theme';
import { H2, Body, BodySmall, Caption, H3 } from '../components/Typography';
import GlassCard from '../components/GlassCard';
import { GothicButton } from '../components/GothicButton';
import { GothicInput } from '../components/GothicInput';
import { Icon } from '../components/Icon';
import { WalletService, NETWORKS } from '../services/WalletService';
import { TokenService, TokenAsset } from '../services/TokenService';
import { useAuth } from '../store/AuthContext';
import { useAlert } from '../context/AlertContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/types';
import { RouteProp } from '@react-navigation/native';

type SendScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Send'>;
type SendScreenRouteProp = RouteProp<MainStackParamList, 'Send'>;

interface Props {
    navigation: SendScreenNavigationProp;
    route: SendScreenRouteProp;
}

export const SendScreen = ({ navigation, route }: Props) => {
    const { activeWallet } = useAuth();
    const { showAlert } = useAlert();
    // Get current network info for defaults
    const chainId = WalletService.getChainId();
    const currentNetwork = Object.values(NETWORKS).find(n => n.chainId === chainId) || NETWORKS.sepolia;
    const initialAsset = (route.params as any)?.asset || {
        symbol: currentNetwork.symbol,
        name: currentNetwork.name,
        type: 'native',
        balance: '0.0',
        id: 'native',
        decimals: 18
    };

    const [asset, setAsset] = useState(initialAsset);
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [isEstimating, setIsEstimating] = useState(false);

    // Asset Selection State
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [availableAssets, setAvailableAssets] = useState<any[]>([]);

    useEffect(() => {
        loadAssets();
    }, [activeWallet]);

    const loadAssets = async () => {
        if (!activeWallet) return;
        try {
            const chainId = WalletService.getChainId(); // Assuming synchronous or cached
            const [ethBal, tokenAssets] = await Promise.all([
                WalletService.getBalance(),
                TokenService.fetchTokenBalances(activeWallet.address, chainId)
            ]);

            const config = Object.values(NETWORKS).find(n => n.chainId === chainId) || NETWORKS.sepolia;

            const nativeAsset = {
                id: 'native',
                symbol: config.symbol,
                name: config.name,
                type: 'native',
                balance: ethBal,
                decimals: 18
            };

            // Filter assets with balance > 0
            const allAssets = [nativeAsset, ...tokenAssets.map(t => ({ ...t, type: 'erc20' }))].filter(a => parseFloat(a.balance) > 0);
            setAvailableAssets(allAssets);

            // Update current asset balance if it exists in the list
            const current = allAssets.find(a => a.symbol === asset.symbol && a.type === asset.type);
            if (current) {
                setAsset(current);
            }
        } catch (error) {
            console.error('Failed to load assets', error);
        }
    };

    const handleMax = () => {
        setAmount(asset.balance);
    };

    const handlePreview = async () => {
        if (!recipient || !amount) {
            showAlert('Error', 'Please fill in all fields.');
            return;
        }

        // Validation: Self-Send
        if (activeWallet && recipient.toLowerCase() === activeWallet.address.toLowerCase()) {
            showAlert('Invalid Recipient', 'You cannot send assets to your own address.');
            return;
        }

        if (!recipient.startsWith('0x') || recipient.length !== 42) {
            showAlert('Error', 'Invalid recipient address.');
            return;
        }

        // Validation: Balance
        if (parseFloat(amount) > parseFloat(asset.balance)) {
            showAlert('Insufficient Balance', `You cannot send more than ${asset.balance} ${asset.symbol}.`);
            return;
        }

        setIsEstimating(true);
        try {
            let txData;
            const decimals = asset.decimals || 18;

            if (asset.type === 'erc20') {
                const iface = new ethers.Interface(['function transfer(address to, uint amount)']);
                const data = iface.encodeFunctionData('transfer', [recipient, ethers.parseUnits(amount, decimals)]);
                txData = {
                    to: asset.address,
                    value: '0',
                    data,
                };
            } else {
                txData = {
                    to: recipient,
                    value: amount, // TransactionPreview handles parseEther if native
                    data: '0x',
                };
            }

            navigation.navigate('TransactionPreview', {
                txData,
                asset, // Pass asset info
                transferAmount: amount
            });
        } catch (error) {
            console.error(error);
            showAlert('Error', 'Failed to prepare transaction.');
        } finally {
            setIsEstimating(false);
        }
    };

    const renderAssetModal = () => (
        <Modal
            visible={showAssetModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowAssetModal(false)}
        >
            <View style={styles.modalBackground}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <H3>Select Asset</H3>
                        <TouchableOpacity onPress={() => setShowAssetModal(false)}>
                            <Icon name="close" size={24} color={THEME.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={availableAssets}
                        keyExtractor={(item) => item.id || item.symbol}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.modalItem}
                                onPress={() => {
                                    setAsset(item);
                                    setShowAssetModal(false);
                                    setAmount(''); // Reset amount on asset change
                                }}
                            >
                                <View style={styles.modalItemIcon}>
                                    <Icon name={item.type === 'native' ? 'wallet' : 'shield'} size={20} color={THEME.colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Body>{item.name}</Body>
                                    <Caption>{item.symbol}</Caption>
                                </View>
                                <H3>{parseFloat(item.balance).toFixed(4)}</H3>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={THEME.colors.primary} />
                </TouchableOpacity>
                <H2>Broadcasting</H2>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.textContainer}>
                    <H2 style={styles.title}>Send Assets</H2>
                    <Body style={styles.subtitle}>
                        Enter the recipient's public address and the amount to transfer.
                    </Body>
                </View>

                <View style={[styles.form, { marginTop: THEME.spacing.lg }]}>
                    <TouchableOpacity onPress={() => setShowAssetModal(true)} activeOpacity={0.8}>
                        <GlassCard style={styles.assetSelection}>
                            <View style={styles.assetIcon}>
                                <Icon name={asset.type === 'native' ? 'wallet' : 'shield'} size={18} color={THEME.colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <BodySmall>Sending {asset.name}</BodySmall>
                                <Caption color={THEME.colors.textSecondary}>Balance: {asset.balance} {asset.symbol}</Caption>
                            </View>
                            <Icon name="chevron-down" size={20} color={THEME.colors.textSecondary} />
                        </GlassCard>
                    </TouchableOpacity>

                    <GothicInput
                        label="RECIPIENT ADDRESS"
                        placeholder="0x..."
                        value={recipient}
                        onChangeText={setRecipient}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <View style={styles.amountContainer}>
                        <GothicInput
                            label={`AMOUNT (${asset.symbol})`}
                            placeholder="0.0"
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="decimal-pad"
                        />
                        <TouchableOpacity style={styles.maxBtn} onPress={handleMax}>
                            <BodySmall style={styles.maxText}>MAX</BodySmall>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <GothicButton
                        title={isEstimating ? 'PREPARING...' : 'Review Transaction'}
                        onPress={handlePreview}
                        disabled={isEstimating || !recipient || !amount}
                        icon="arrow-up-right"
                    />
                </View>
            </ScrollView>
            {renderAssetModal()}
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
    scrollContent: {
        padding: THEME.spacing.lg,
        flexGrow: 1,
    },
    textContainer: {
        marginTop: THEME.spacing.md,
        marginBottom: THEME.spacing.xl,
    },
    title: {
        textAlign: 'center',
        marginBottom: THEME.spacing.sm,
    },
    subtitle: {
        color: THEME.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    form: {
        flex: 1,
    },
    assetSelection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: THEME.spacing.sm,
        marginBottom: THEME.spacing.xl,
        borderWidth: 1,
        borderColor: THEME.colors.border,
    },
    assetIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(230, 194, 0, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: THEME.spacing.md,
    },
    amountContainer: {
        position: 'relative',
        marginTop: THEME.spacing.md,
    },
    maxBtn: {
        position: 'absolute',
        right: THEME.spacing.md,
        top: 38, // Align with input field
        padding: THEME.spacing.xs,
        backgroundColor: 'rgba(230, 194, 0, 0.1)',
        borderRadius: THEME.radius.sm,
    },
    maxText: {
        color: THEME.colors.primary,
        fontSize: 10,
        fontWeight: '700',
    },
    footer: {
        marginTop: THEME.spacing.huge,
        marginBottom: THEME.spacing.xl,
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: THEME.colors.surface,
        borderTopLeftRadius: THEME.radius.lg,
        borderTopRightRadius: THEME.radius.lg,
        padding: THEME.spacing.lg,
        maxHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: THEME.spacing.lg,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: THEME.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.border + '44',
    },
    modalItemIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: THEME.colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: THEME.spacing.md,
    },
});
