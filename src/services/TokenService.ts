import { ethers } from 'ethers';
import { WalletService } from './WalletService';

export interface TokenAsset {
    symbol: string;
    name: string;
    address: string;
    balance: string;
    decimals: number;
    logo?: string;
}

const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function name() view returns (string)',
];

const COMMON_TOKENS: { [chainId: number]: Partial<TokenAsset>[] } = {
    11155111: [ // Sepolia
        {
            symbol: 'LINK',
            name: 'Chainlink',
            address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
            decimals: 18,
        },
        {
            symbol: 'USDT',
            name: 'Tether USD',
            address: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
            decimals: 6,
        },
    ],
};

export class TokenService {
    /**
     * Fetch balances for all tokens on the current network
     */
    static async fetchTokenBalances(walletAddress: string, chainId: number): Promise<TokenAsset[]> {
        const tokens = COMMON_TOKENS[chainId] || [];
        const results: TokenAsset[] = [];
        const provider = WalletService.getProvider();

        if (!provider) return [];

        for (const token of tokens) {
            try {
                const contract = new ethers.Contract(token.address!, ERC20_ABI, provider);
                const [balance, decimals, name, symbol] = await Promise.all([
                    contract.balanceOf(walletAddress),
                    token.decimals ? Promise.resolve(token.decimals) : contract.decimals(),
                    token.name ? Promise.resolve(token.name) : contract.name(),
                    token.symbol ? Promise.resolve(token.symbol) : contract.symbol(),
                ]);

                results.push({
                    symbol,
                    name,
                    address: token.address!,
                    balance: ethers.formatUnits(balance, decimals),
                    decimals,
                });
            } catch (error) {
                console.error(`Failed to fetch balance for ${token.symbol}:`, error);
            }
        }

        return results;
    }

    /**
     * Add a custom token by address
     */
    static async getCustomTokenMetadata(tokenAddress: string): Promise<Partial<TokenAsset> | null> {
        const provider = WalletService.getProvider();
        if (!provider) return null;

        try {
            const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
            const [decimals, name, symbol] = await Promise.all([
                contract.decimals(),
                contract.name(),
                contract.symbol(),
            ]);

            return {
                address: tokenAddress,
                decimals,
                name,
                symbol,
            };
        } catch (error) {
            console.error('Failed to fetch token metadata:', error);
            return null;
        }
    }
}
