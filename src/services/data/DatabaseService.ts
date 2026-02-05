import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from './types';
import { EncryptionService } from '../EncryptionService';

/**
 * DatabaseService: Structured storage for large datasets (transaction history)
 * In production this would use react-native-quick-sqlite
 */
export class DatabaseService {
    private static txCache: Map<string, Transaction[]> = new Map();

    static async saveTransactions(address: string, chainId: number, newTxs: Transaction[]) {
        const key = `${address}_${chainId}`;
        const existing = await this.getTransactions(address, chainId);

        // Prevent duplicates using hash map and filter out null hashes
        const txMap = new Map(existing.map(tx => [tx.hash, tx]));
        newTxs.filter(tx => tx && tx.hash).forEach(tx => txMap.set(tx.hash, tx));

        const merged = Array.from(txMap.values()).sort((a, b) => b.timestamp - a.timestamp);

        this.txCache.set(key, merged);
        const encryptedData = await EncryptionService.encrypt(JSON.stringify(merged));
        await AsyncStorage.setItem(`@txs_${key}`, encryptedData);
    }

    static async getTransactions(address: string, chainId: number): Promise<Transaction[]> {
        const key = `${address}_${chainId}`;
        if (this.txCache.has(key)) return this.txCache.get(key) || [];

        try {
            let data = await AsyncStorage.getItem(`@txs_${key}`);
            if (data) {
                try {
                    data = await EncryptionService.decrypt(data);
                } catch (e) { }
            }
            const txs = data ? JSON.parse(data) : [];
            this.txCache.set(key, txs);
            return txs;
        } catch (e) {
            return [];
        }
    }

    static async clearHistory(address: string, chainId: number) {
        const key = `${address}_${chainId}`;
        this.txCache.delete(key);
        await AsyncStorage.removeItem(`@txs_${key}`);
    }
}
