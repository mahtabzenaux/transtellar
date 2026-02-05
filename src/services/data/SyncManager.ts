import { RealTimeEngine, RealTimeEvent } from './RealTimeEngine';
import { HistoryService } from './HistoryService';
import { MarketService } from './MarketService';
import { StorageSyncState, Transaction } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseService } from './DatabaseService';
import { StateStore } from './StateStore';

const SYNC_STATE_KEY = '@web3wallet_sync_state';

export class SyncManager {
    private static isInitialized = false;
    private static syncState: StorageSyncState = {};

    static async init() {
        if (this.isInitialized) return;

        await this.loadSyncState();
        RealTimeEngine.addListener(this.handleRealTimeEvent.bind(this));
        this.isInitialized = true;
        console.log('[SyncManager] Initialized');
    }

    private static async loadSyncState() {
        try {
            const data = await AsyncStorage.getItem(SYNC_STATE_KEY);
            if (data) {
                this.syncState = JSON.parse(data);
            }
        } catch (error) {
            console.error('[SyncManager] Failed to load sync state:', error);
        }
    }

    private static async saveSyncState() {
        try {
            await AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(this.syncState));
        } catch (error) {
            console.error('[SyncManager] Failed to save sync state:', error);
        }
    }

    static async startSync(address: string, chainId: number, rpcUrl: string) {
        console.log(`[SyncManager] Starting sync for ${address} on chain ${chainId}`);

        // 1. Start Real-time monitoring
        await RealTimeEngine.startMonitoring(chainId, rpcUrl, address);

        // 2. Perform initial background sync
        this.performIncrementalSync(address, chainId);
    }

    private static async handleRealTimeEvent(event: RealTimeEvent) {
        console.log(`[SyncManager] Real-time event received: ${event.type} on chain ${event.chainId}`);

        if (event.type === 'block' || event.type === 'sync_needed' || event.type === 'transfer') {
            // Trigger incremental fetch
            // In a real app, we'd know which wallet to sync based on internal state
            // For now, let's assume we sync the active wallet (handled by higher level logic)
        }
    }

    /**
     * Incremental sync strategy:
     * Fetch new data from Moralis since last known block or cursor
     */
    static async performIncrementalSync(address: string, chainId: number) {
        const state = this.getWalletSyncState(address, chainId);

        console.log(`[SyncManager] Performing incremental sync for ${address}. Last block: ${state.lastSyncedBlock}`);

        // Fetch native txs
        const { results: nativeTxs, nextCursor } = await HistoryService.fetchTransactions(address, chainId, state.cursor);

        // Fetch token transfers
        const { results: tokenTxs } = await HistoryService.fetchTokenTransfers(address, chainId);

        const allTxs = [...nativeTxs, ...tokenTxs];

        if (allTxs.length > 0) {
            // Process and save to local storage (SQLite/equivalent)
            await this.processIncomingTransactions(address, chainId, allTxs);

            // Update sync state
            const latestBlock = Math.max(...allTxs.map(tx => tx.blockNumber || 0), state.lastSyncedBlock);
            this.updateSyncState(address, chainId, {
                lastSyncedBlock: latestBlock,
                lastSyncedTimestamp: Date.now(),
                cursor: nextCursor
            });
        }
    }

    private static async processIncomingTransactions(address: string, chainId: number, txs: Transaction[]) {
        if (txs.length === 0) return;

        console.log(`[SyncManager] Saving ${txs.length} new transactions for ${address}`);
        await DatabaseService.saveTransactions(address, chainId, txs);
    }

    private static getWalletSyncState(address: string, chainId: number) {
        return this.syncState[chainId]?.[address] || {
            lastSyncedBlock: 0,
            lastSyncedTimestamp: 0
        };
    }

    private static updateSyncState(address: string, chainId: number, partialState: any) {
        if (!this.syncState[chainId]) this.syncState[chainId] = {};
        this.syncState[chainId][address] = {
            ...this.getWalletSyncState(address, chainId),
            ...partialState
        };
        this.saveSyncState();
    }
}
