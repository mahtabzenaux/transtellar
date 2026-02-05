import { ethers } from 'ethers';
import { SecurityService } from './SecurityService';
import { StorageService } from './StorageService';
import { NotificationService } from './NotificationService';
import { INFURA_PROJECT_ID } from '../config/ApiConfig';

export interface NetworkConfig {
    name: string;
    rpcUrl: string;
    fallbackRpcs?: string[];
    chainId: number;
    symbol: string;
    explorerUrl?: string;
    notes?: string;
}


// Helper to produce an Infura URL for networks that follow the <network>.infura.io pattern
const infura = (subdomain: string) =>
    `https://${subdomain}.infura.io/v3/${INFURA_PROJECT_ID}`;

export const NETWORKS: { [key: string]: NetworkConfig } = {
    ethereum: {
        name: 'Ethereum Mainnet',
        rpcUrl: infura('mainnet'),
        chainId: 1,
        symbol: 'ETH',
        explorerUrl: 'https://etherscan.io',
    },

    goerli: {
        name: 'Goerli Testnet',
        rpcUrl: infura('goerli'),
        chainId: 5,
        symbol: 'gETH',
        explorerUrl: 'https://goerli.etherscan.io',
        notes: 'Goerli has been historically available; check Infura for current support status.',
    },

    sepolia: {
        name: 'Sepolia Testnet',
        rpcUrl: infura('sepolia'),
        chainId: 11155111,
        symbol: 'ETH',
        explorerUrl: 'https://sepolia.etherscan.io',
    },

    polygon: {
        name: 'Polygon (Matic) Mainnet',
        rpcUrl: `https://polygon-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
        chainId: 137,
        symbol: 'POL',
        explorerUrl: 'https://polygonscan.com',
    },

    polygonMumbai: {
        name: 'Polygon Mumbai Testnet',
        rpcUrl: `https://polygon-mumbai.infura.io/v3/${INFURA_PROJECT_ID}`,
        chainId: 80001,
        symbol: 'POL',
        explorerUrl: 'https://mumbai.polygonscan.com',
    },

    optimism: {
        name: 'Optimism Mainnet',
        rpcUrl: `https://optimism-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
        chainId: 10,
        symbol: 'ETH',
        explorerUrl: 'https://optimistic.etherscan.io',
    },

    optimismGoerli: {
        name: 'Optimism Goerli (testnet)',
        rpcUrl: `https://optimism-goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
        chainId: 420,
        symbol: 'ETH',
        explorerUrl: 'https://goerli-optimism.etherscan.io',
    },

    arbitrum: {
        name: 'Arbitrum One',
        rpcUrl: `https://arbitrum-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
        chainId: 42161,
        symbol: 'ETH',
        explorerUrl: 'https://arbiscan.io',
    },

    arbitrumGoerli: {
        name: 'Arbitrum Goerli (testnet)',
        rpcUrl: `https://arbitrum-goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
        chainId: 421613,
        symbol: 'ETH',
        explorerUrl: 'https://goerli.arbiscan.io',
    },

    base: {
        name: 'Base (Coinbase) Mainnet',
        rpcUrl: `https://base-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
        chainId: 8453,
        symbol: 'ETH',
        explorerUrl: 'https://basescan.org',
        notes: 'Confirm Infura endpoint subdomain for Base if there are connection issues.',
    }
};

export class WalletService {
    private static currentNetwork: NetworkConfig = NETWORKS.sepolia;
    private static provider: ethers.Provider = new ethers.JsonRpcProvider(NETWORKS.sepolia.rpcUrl);
    private static wallet: ethers.Wallet | null = null;

    static getProvider() {
        return this.provider;
    }

    static getChainId() {
        return this.currentNetwork.chainId;
    }

    /**
     * Initialize provider for a network with health-checked fallback support
     */
    static async switchNetwork(chainId: number) {
        const config = Object.values(NETWORKS).find(n => n.chainId === chainId);
        if (config) {
            this.currentNetwork = config;

            // Custom RPCs from storage
            const customRpcs = await StorageService.getCustomRpcs(chainId);
            const allRpcs = [config.rpcUrl, ...(config.fallbackRpcs || []), ...customRpcs];

            console.log(`[WalletService] Initializing network ${config.name} with ${allRpcs.length} potential RPCs`);

            // Validate and filter healthy RPCs
            const healthyRpcs = await this.filterHealthyRpcs(allRpcs);

            if (healthyRpcs.length === 0) {
                console.warn('[WalletService] No healthy RPCs found, using default as last resort');
                healthyRpcs.push(config.rpcUrl);
            }

            // Setup FallbackProvider with weighted healthy RPCs
            const providers = healthyRpcs.map((url, index) => ({
                provider: new ethers.JsonRpcProvider(url),
                priority: index + 1, // Prioritize the ones that responded fastest
                weight: 1,
            }));

            this.provider = new ethers.FallbackProvider(providers);

            if (this.wallet) {
                this.wallet = new ethers.Wallet(this.wallet.privateKey, this.provider);
            }
            return true;
        }
        return false;
    }

    /**
     * Checks health and latency of RPC endpoints
     */
    private static async filterHealthyRpcs(urls: string[]): Promise<string[]> {
        const results = await Promise.allSettled(urls.map(async (url) => {
            const start = Date.now();
            const provider = new ethers.JsonRpcProvider(url);

            // 3-second timeout for the block number check
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 3000)
            );

            await Promise.race([
                provider.getBlockNumber(),
                timeoutPromise
            ]);

            return { url, latency: Date.now() - start };
        }));

        return results
            .filter((r): r is PromiseFulfilledResult<{ url: string, latency: number }> => r.status === 'fulfilled')
            .sort((a, b) => a.value.latency - b.value.latency)
            .map(r => r.value.url);
    }

    static async signMessage(message: string): Promise<string | null> {
        if (!this.wallet) return null;
        try {
            return await this.wallet.signMessage(message);
        } catch (error) {
            console.error('Signing failed:', error);
            return null;
        }
    }

    static async createWallet(walletId: string): Promise<{ address: string; mnemonic: string } | null> {
        const wallet = ethers.Wallet.createRandom();
        const address = wallet.address;
        const mnemonic = wallet.mnemonic?.phrase;

        if (mnemonic) {
            // New wallets always start at index 0
            const stored = await SecurityService.storeSecrets(walletId, wallet.privateKey, mnemonic);
            if (stored) {
                this.wallet = new ethers.Wallet(wallet.privateKey, this.provider);
                return { address, mnemonic };
            }
        }
        return null;
    }

    static async importFromMnemonic(phrase: string, walletId: string, index: number = 0): Promise<string | null> {
        try {
            console.log(`[WalletService] Deriving wallet for index ${index}...`);
            const path = `m/44'/60'/0'/0/${index}`;
            const wallet = ethers.HDNodeWallet.fromPhrase(phrase, undefined, path);
            console.log('[WalletService] Derived address:', wallet.address);

            const stored = await SecurityService.storeSecrets(walletId, wallet.privateKey, phrase);
            if (stored) {
                this.wallet = new ethers.Wallet(wallet.privateKey, this.provider);
                return wallet.address;
            } else {
                console.error('[WalletService] SecurityService failed to store secrets.');
                return null;
            }
        } catch (error) {
            console.error('[WalletService] Import from mnemonic failed:', error);
            return null;
        }
    }

    static async loadWallet(walletId: string): Promise<string | null> {
        const secrets = await SecurityService.getSecrets(walletId);
        if (secrets) {
            this.wallet = new ethers.Wallet(secrets.privateKey, this.provider);
            return this.wallet.address;
        }
        return null;
    }

    static async getBalance(): Promise<string> {
        if (!this.wallet) return '0.0';
        try {
            const balance = await this.provider.getBalance(this.wallet.address);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error('Failed to fetch balance:', error);
            return '0.0';
        }
    }

    static async estimateGas(to: string, value: string, data: string = '0x'): Promise<bigint> {
        return await this.provider.estimateGas({
            to,
            value: value.startsWith('0x') ? BigInt(value) : ethers.parseEther(value),
            data,
        });
    }

    static async sendTransaction(to: string, value: string, data: string = '0x'): Promise<ethers.TransactionResponse | null> {
        if (!this.wallet) return null;
        try {
            let parsedValue: bigint;
            if (value.startsWith('0x')) {
                parsedValue = BigInt(value);
            } else {
                parsedValue = ethers.parseEther(value);
            }

            const tx = await this.wallet.sendTransaction({
                to,
                value: parsedValue,
                data,
            });

            // Save to history
            const history = await StorageService.getTxHistory(this.wallet.address, this.currentNetwork.chainId);
            const newTx = {
                hash: tx.hash,
                from: this.wallet.address,
                to,
                value: value.startsWith('0x') ? ethers.formatEther(parsedValue) : value,
                timestamp: Date.now(),
                status: 'confirmed', // ethers.js sendTransaction resolves when broadcasted, but we'll assume confirmed for simplicity or wait for confirmation
                type: 'send'
            };
            await StorageService.saveTxHistory(this.wallet.address, this.currentNetwork.chainId, [newTx, ...history]);

            NotificationService.notify(
                'transaction',
                'Transaction Broadcasted',
                `Your transaction to ${to.slice(0, 6)}... has been sent to the network.`,
                { hash: tx.hash }
            );

            return tx;
        } catch (error: any) {
            console.error('Transaction failed:', error);
            NotificationService.notify(
                'transaction',
                'Transaction Failed',
                error.message || 'An error occurred while broadcasting your transaction.'
            );
            return null;
        }
    }
}
