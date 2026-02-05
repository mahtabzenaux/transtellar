import { ethers } from 'ethers';

export interface RealTimeEvent {
    type: 'block' | 'transfer' | 'sync_needed';
    chainId: number;
    data: any;
}

export class RealTimeEngine {
    private static providers: Map<number, ethers.WebSocketProvider> = new Map();
    private static listeners: Set<(event: RealTimeEvent) => void> = new Set();
    private static reconnectionAttempts: Map<number, number> = new Map();

    static addListener(callback: (event: RealTimeEvent) => void) {
        this.listeners.add(callback);
    }

    static removeListener(callback: (event: RealTimeEvent) => void) {
        this.listeners.delete(callback);
    }

    static async startMonitoring(chainId: number, rpcUrl: string, walletAddress?: string) {
        if (this.providers.has(chainId)) return;

        try {
            // Fix Infura WSS URL: replaces https:// with wss:// and ensures /ws/v3 for newer Infura endpoints
            let wssUrl = rpcUrl.replace('https://', 'wss://');
            if (wssUrl.includes('infura.io') && !wssUrl.includes('/ws/v3')) {
                wssUrl = wssUrl.replace('/v3/', '/ws/v3/');
            }

            console.log(`[RealTimeEngine] Connecting to WebSocket: ${wssUrl}`);

            const provider = new ethers.WebSocketProvider(wssUrl);
            this.providers.set(chainId, provider);

            provider.on('block', (blockNumber) => {
                this.notify({ type: 'block', chainId, data: { blockNumber } });
            });

            if (walletAddress) {
                this.subscribeToWalletLogs(chainId, provider, walletAddress);
            }

            // Handle disconnection
            const websocket = (provider as any).websocket;
            if (websocket) {
                websocket.onclose = () => {
                    console.warn(`[RealTimeEngine] WebSocket closed for chain ${chainId}. Retrying...`);
                    this.providers.delete(chainId);
                    this.handleReconnect(chainId, rpcUrl, walletAddress);
                };
            }

        } catch (error) {
            console.error(`[RealTimeEngine] Connection failed for chain ${chainId}:`, error);
            this.handleReconnect(chainId, rpcUrl, walletAddress);
        }
    }

    private static subscribeToWalletLogs(chainId: number, provider: ethers.WebSocketProvider, address: string) {
        // Filter for any transfer to or from the wallet
        const filter = {
            address: undefined, // Monitor all logs
            topics: [
                ethers.id("Transfer(address,address,uint256)"),
                null, // From any
                ethers.zeroPadValue(address, 32) // To wallet
            ]
        };

        const fromFilter = {
            address: undefined,
            topics: [
                ethers.id("Transfer(address,address,uint256)"),
                ethers.zeroPadValue(address, 32), // From wallet
            ]
        };

        provider.on(filter, (log) => {
            this.notify({ type: 'transfer', chainId, data: log });
        });

        provider.on(fromFilter, (log) => {
            this.notify({ type: 'transfer', chainId, data: log });
        });
    }

    private static handleReconnect(chainId: number, rpcUrl: string, address?: string) {
        const attempts = this.reconnectionAttempts.get(chainId) || 0;
        if (attempts > 10) {
            console.error(`[RealTimeEngine] Max reconnection attempts reached for chain ${chainId}`);
            return;
        }

        const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
        this.reconnectionAttempts.set(chainId, attempts + 1);

        setTimeout(() => {
            this.startMonitoring(chainId, rpcUrl, address);
        }, delay);
    }

    private static notify(event: RealTimeEvent) {
        this.listeners.forEach(l => l(event));
    }

    static stopMonitoring(chainId: number) {
        const provider = this.providers.get(chainId);
        if (provider) {
            provider.removeAllListeners();
            provider.destroy();
            this.providers.delete(chainId);
        }
    }
}
