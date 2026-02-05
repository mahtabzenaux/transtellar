import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { THEME } from '../theme/theme';
import { PROVIDER_INJECTION } from '../utils/providerInjection';
import { BridgeService } from '../services/BridgeService';
import { WalletService } from '../services/WalletService';
import { useAuth } from '../store/AuthContext';
import { BodySmall, Caption, H2 } from '../components/Typography';
import { Icon } from '../components/Icon';
import { Web3ApprovalModal, ApprovalRequest } from '../components/Web3ApprovalModal';

import { BrowserTab, StorageService } from '../services/StorageService';
import { useAlert } from '../context/AlertContext';

const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1';
const DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36';

const DEFAULT_DAPP = 'https://app.uniswap.org';

export const DAppBrowserScreen = () => {
    const [tabs, setTabs] = useState<BrowserTab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const [showTabManager, setShowTabManager] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [isDesktopMode, setIsDesktopMode] = useState(false);
    const [canGoBack, setCanGoBack] = useState(false);
    const [canGoForward, setCanGoForward] = useState(false);
    const webViewRefs = useRef<Record<string, WebView | null>>({});

    useEffect(() => {
        loadBrowserState();
    }, []);

    const loadBrowserState = async () => {
        const state = await StorageService.getBrowserState();
        if (state.tabs.length > 0) {
            setTabs(state.tabs);
            setActiveTabId(state.tabs[0].id);
            setUrlInput(state.tabs[0].url);
        } else {
            // Create initial tab
            createNewTab(DEFAULT_DAPP);
        }
    };

    const createNewTab = (url: string = DEFAULT_DAPP) => {
        const newTab: BrowserTab = {
            id: Date.now().toString(),
            url,
            title: 'New Tab',
            history: [url]
        };
        const newTabs = [...tabs, newTab];
        setTabs(newTabs);
        setActiveTabId(newTab.id);
        setUrlInput(url);
        setShowTabManager(false);
        StorageService.updateBrowserTabs(newTabs);
    };

    const closeTab = (id: string, event?: any) => {
        event?.stopPropagation();
        const newTabs = tabs.filter(t => t.id !== id);
        if (newTabs.length === 0) {
            setTabs([]);
            createNewTab();
            return;
        }
        if (activeTabId === id) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
        }
        setTabs(newTabs);
        StorageService.updateBrowserTabs(newTabs);
    };

    const activeTab = tabs.find(t => t.id === activeTabId);

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [activeRequest, setActiveRequest] = useState<ApprovalRequest | null>(null);
    const [pendingResolve, setPendingResolve] = useState<{ id: number, resolve: (val: any) => void, reject: (err: any) => void } | null>(null);

    const handleMessage = async (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'wallet_request') {
                const needsApproval = ['eth_requestAccounts', 'eth_sendTransaction', 'personal_sign'].includes(data.method);

                if (needsApproval) {
                    setActiveRequest({
                        method: data.method,
                        params: data.params,
                        origin: new URL(activeTab?.url || '').hostname
                    });
                    setModalVisible(true);

                    return new Promise((resolve, reject) => {
                        setPendingResolve({ id: data.id, resolve, reject });
                    }).then(result => {
                        webViewRefs.current[activeTabId!]?.postMessage(JSON.stringify({
                            type: 'wallet_response',
                            id: data.id,
                            result
                        }));
                    }).catch(error => {
                        webViewRefs.current[activeTabId!]?.postMessage(JSON.stringify({
                            type: 'wallet_response',
                            id: data.id,
                            error: error.message
                        }));
                    });
                } else {
                    try {
                        const result = await BridgeService.handleRequest(data);
                        webViewRefs.current[activeTabId!]?.postMessage(JSON.stringify({
                            type: 'wallet_response',
                            id: data.id,
                            result
                        }));
                    } catch (error: any) {
                        webViewRefs.current[activeTabId!]?.postMessage(JSON.stringify({
                            type: 'wallet_response',
                            id: data.id,
                            error: error.message
                        }));
                    }
                }
            }
        } catch (e) {
            console.error('Failed to parse WebView message:', e);
        }
    };

    const onApprove = async () => {
        if (!activeRequest || !pendingResolve) return;
        try {
            const result = await BridgeService.handleRequest({
                id: pendingResolve.id,
                method: activeRequest.method,
                params: activeRequest.params
            });
            pendingResolve.resolve(result);
        } catch (error) {
            pendingResolve.reject(error);
        } finally {
            setModalVisible(false);
            setActiveRequest(null);
            setPendingResolve(null);
        }
    };

    const onReject = () => {
        if (pendingResolve) {
            pendingResolve.reject(new Error('User rejected the request'));
        }
        setModalVisible(false);
        setActiveRequest(null);
        setPendingResolve(null);
    };

    const navigateToUrl = () => {
        let targetUrl = urlInput;
        if (!targetUrl.startsWith('http') && !targetUrl.includes('.')) {
            targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`;
        } else if (!targetUrl.startsWith('http')) {
            targetUrl = 'https://' + targetUrl;
        }

        if (activeTab) {
            const updatedTabs = tabs.map(t =>
                t.id === activeTabId ? { ...t, url: targetUrl } : t
            );
            setTabs(updatedTabs);
            StorageService.updateBrowserTabs(updatedTabs);
        }
    };

    const emitEvent = (eventType: string, data: any) => {
        const message = JSON.stringify({
            type: 'wallet_event',
            event: eventType,
            data
        });
        Object.values(webViewRefs.current).forEach(ref => {
            ref?.postMessage(message);
        });
    };

    const { activeWallet } = useAuth();
    const chainId = WalletService.getChainId();

    useEffect(() => {
        if (activeWallet) {
            emitEvent('accountsChanged', [activeWallet.address]);
        }
    }, [activeWallet]);

    const { showAlert } = useAlert();

    const handleSettings = () => {
        showAlert(
            'Browser Settings',
            `Current Mode: ${isDesktopMode ? 'Desktop' : 'Mobile'}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: isDesktopMode ? 'Switch to Mobile' : 'Switch to Desktop',
                    onPress: () => setIsDesktopMode(!isDesktopMode)
                },
                {
                    text: 'Reset Tabs',
                    style: 'destructive',
                    onPress: () => {
                        setTabs([]);
                        createNewTab();
                    }
                }
            ]
        );
    };

    useEffect(() => {
        const hexChainId = '0x' + chainId.toString(16);
        emitEvent('chainChanged', hexChainId);
    }, [chainId]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.urlBar}>
                <TouchableOpacity
                    onPress={() => setShowTabManager(true)}
                    style={styles.tabCounter}
                >
                    <View style={styles.counterBox}>
                        <Caption style={styles.counterText}>{tabs.length}</Caption>
                    </View>
                </TouchableOpacity>

                <View style={[styles.inputContainer]}>
                    <TextInput
                        style={styles.input}
                        value={urlInput}
                        onChangeText={setUrlInput}
                        onSubmitEditing={navigateToUrl}
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="Search or enter URL"
                        placeholderTextColor={THEME.colors.textSecondary}
                    />
                </View>

                <TouchableOpacity
                    onPress={handleSettings}
                    style={styles.settingsIcon}
                >
                    <Icon
                        name="settings"
                        size={20}
                        color={isDesktopMode ? THEME.colors.primary : THEME.colors.textSecondary}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.webviewWrapper}>
                {tabs.map(tab => (
                    <View
                        key={tab.id}
                        style={[styles.tabContent, activeTabId !== tab.id && styles.hiddenTab]}
                    >
                        <WebView
                            ref={ref => { if (ref) webViewRefs.current[tab.id] = ref; }}
                            source={{ uri: tab.url }}
                            onMessage={handleMessage}
                            injectedJavaScript={PROVIDER_INJECTION}
                            userAgent={isDesktopMode ? DESKTOP_UA : MOBILE_UA}
                            onNavigationStateChange={(navState) => {
                                if (activeTabId === tab.id) {
                                    setUrlInput(navState.url);
                                    setCanGoBack(navState.canGoBack);
                                    setCanGoForward(navState.canGoForward);
                                }
                            }}
                            style={styles.webview}
                            containerStyle={{ backgroundColor: THEME.colors.background }}
                        />
                    </View>
                ))}
            </View>

            {/* Navigation Toolbar */}
            <View style={styles.toolbar}>
                <TouchableOpacity
                    onPress={() => webViewRefs.current[activeTabId!]?.goBack()}
                    disabled={!canGoBack}
                    style={styles.toolBtn}
                >
                    <Icon name="chevron-left" size={24} color={canGoBack ? THEME.colors.primary : THEME.colors.textSecondary + '40'} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => webViewRefs.current[activeTabId!]?.goForward()}
                    disabled={!canGoForward}
                    style={styles.toolBtn}
                >
                    <Icon name="chevron-right" size={24} color={canGoForward ? THEME.colors.primary : THEME.colors.textSecondary + '40'} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => webViewRefs.current[activeTabId!]?.reload()}
                    style={styles.toolBtn}
                >
                    <Icon name="refresh" size={22} color={THEME.colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => {
                        setUrlInput(DEFAULT_DAPP);
                        if (activeTab) {
                            const updatedTabs = tabs.map(t =>
                                t.id === activeTabId ? { ...t, url: DEFAULT_DAPP } : t
                            );
                            setTabs(updatedTabs);
                            StorageService.updateBrowserTabs(updatedTabs);
                        }
                    }}
                    style={styles.toolBtn}
                >
                    <Icon name="home" size={22} color={THEME.colors.primary} />
                </TouchableOpacity>
            </View>

            {showTabManager && (
                <View style={styles.tabManagerOverlay}>
                    <View style={styles.tabManagerHeader}>
                        <TouchableOpacity onPress={() => setShowTabManager(false)}>
                            <Icon name="close" size={24} color={THEME.colors.text} />
                        </TouchableOpacity>
                        <H2>Tabs</H2>
                        <TouchableOpacity onPress={() => createNewTab()}>
                            <Icon name="plus" size={24} color={THEME.colors.primary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.tabsGrid}>
                        {tabs.map(tab => (
                            <TouchableOpacity
                                key={tab.id}
                                style={[styles.tabCard, activeTabId === tab.id && styles.activeTabCard]}
                                onPress={() => {
                                    setActiveTabId(tab.id);
                                    setUrlInput(tab.url);
                                    setShowTabManager(false);
                                }}
                            >
                                <View style={styles.tabCardHeader}>
                                    <BodySmall numberOfLines={1} style={{ flex: 1 }}>{tab.title || tab.url}</BodySmall>
                                    <TouchableOpacity onPress={(e) => closeTab(tab.id, e)}>
                                        <Icon name="close" size={16} color={THEME.colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.tabPreview}>
                                    <View style={styles.urlLabel}>
                                        <Caption color={THEME.colors.textSecondary} numberOfLines={1}>{tab.url}</Caption>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            <Web3ApprovalModal
                visible={modalVisible}
                request={activeRequest}
                onApprove={onApprove}
                onReject={onReject}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    urlBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: THEME.spacing.sm,
        paddingHorizontal: THEME.spacing.md,
        backgroundColor: THEME.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(230, 194, 0, 0.1)',
    },
    tabCounter: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: THEME.colors.primary,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: THEME.spacing.md,
    },
    counterBox: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterText: {
        color: THEME.colors.primary,
        fontWeight: '700',
        fontSize: 10,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 36,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: THEME.radius.full,
        paddingHorizontal: THEME.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(230, 194, 0, 0.1)',
    },
    input: {
        flex: 1,
        color: THEME.colors.text,
        fontSize: 12,
        height: '100%',
        padding: 0,
    },
    settingsIcon: {
        padding: THEME.spacing.sm,
        marginLeft: THEME.spacing.xs,
    },
    webviewWrapper: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    tabContent: {
        flex: 1,
    },
    hiddenTab: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: 0,
        width: 0,
        opacity: 0,
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    tabManagerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: THEME.colors.background,
        zIndex: 1000,
    },
    tabManagerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: THEME.spacing.lg,
        paddingTop: 60,
        paddingBottom: THEME.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.border,
    },
    tabsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: THEME.spacing.md,
    },
    tabCard: {
        width: '46%',
        height: 180,
        backgroundColor: THEME.colors.surface,
        borderRadius: THEME.radius.md,
        margin: '2%',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: THEME.colors.border,
    },
    activeTabCard: {
        borderColor: THEME.colors.primary,
        borderWidth: 2,
    },
    tabCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: THEME.spacing.sm,
        backgroundColor: THEME.colors.surfaceLight,
    },
    tabPreview: {
        flex: 1,
        padding: THEME.spacing.sm,
        justifyContent: 'flex-end',
    },
    urlLabel: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 4,
        borderRadius: 4,
    },
    toolbar: {
        flexDirection: 'row',
        height: 56,
        backgroundColor: THEME.colors.surface,
        borderTopWidth: 1,
        borderTopColor: 'rgba(230, 194, 0, 0.1)',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: THEME.spacing.xl,
    },
    toolBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
