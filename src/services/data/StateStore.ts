import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * StateStore: Low-latency storage for critical metrics (balances, prices, cursors)
 * In production this would use react-native-mmkv
 */
export class StateStore {
    static async set(key: string, value: any) {
        try {
            await AsyncStorage.setItem(`@state_${key}`, JSON.stringify(value));
        } catch (e) {
            console.error('[StateStore] Save error:', e);
        }
    }

    static async get<T>(key: string): Promise<T | null> {
        try {
            const data = await AsyncStorage.getItem(`@state_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }
}

export default StateStore; 