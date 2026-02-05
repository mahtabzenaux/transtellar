import { AssetPrice, ChartPoint } from './types';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Simplified mapping of common contracts to CoinGecko IDs
// In production, this would be a more robust list or fetched from a server
const CONTRACT_MAP: Record<string, string> = {
    '0x779877A7B0D9E8603169DdbD7836e478b4624789': 'chainlink', // LINK on Sepolia
    '0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0': 'tether',    // USDT on Sepolia
};

const NATIVE_ID_MAP: Record<number, string> = {
    1: 'ethereum',
    11155111: 'ethereum',
    137: 'matic-network',
    80001: 'matic-network',
    10: 'ethereum',
    42161: 'ethereum',
    8453: 'ethereum',
};

export class MarketService {
    private static priceCache: Record<string, AssetPrice> = {};

    static getCoinGeckoId(symbol: string, address?: string, chainId?: number): string {
        if (address && CONTRACT_MAP[address.toLowerCase()]) {
            return CONTRACT_MAP[address.toLowerCase()];
        }
        if (chainId && NATIVE_ID_MAP[chainId]) {
            return NATIVE_ID_MAP[chainId];
        }
        return symbol.toLowerCase(); // Fallback to symbol
    }

    static async fetchPrice(symbol: string, address?: string, chainId?: number): Promise<AssetPrice | null> {
        try {
            const cgId = this.getCoinGeckoId(symbol, address, chainId);
            const response = await fetch(`${COINGECKO_API}/simple/price?ids=${cgId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`);
            const data = await response.json();

            if (data[cgId]) {
                const price: AssetPrice = {
                    symbol,
                    address,
                    priceUsd: data[cgId].usd,
                    change24h: data[cgId].usd_24h_change || 0,
                    marketCap: data[cgId].usd_market_cap,
                    lastUpdated: Date.now(),
                };
                this.priceCache[cgId] = price;
                return price;
            }
            return null;
        } catch (error) {
            console.error('[MarketService] Failed to fetch price:', error);
            return this.priceCache[symbol.toLowerCase()] || null; // Return cached if available
        }
    }

    static async fetchMultiPrices(assets: { symbol: string, address?: string, chainId: number }[]): Promise<AssetPrice[]> {
        try {
            const ids = assets.map(a => this.getCoinGeckoId(a.symbol, a.address, a.chainId)).join(',');
            const response = await fetch(`${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
            const data = await response.json();

            return assets.map(asset => {
                const cgId = this.getCoinGeckoId(asset.symbol, asset.address, asset.chainId);
                if (data[cgId]) {
                    const price: AssetPrice = {
                        symbol: asset.symbol,
                        address: asset.address,
                        priceUsd: data[cgId].usd,
                        change24h: data[cgId].usd_24h_change || 0,
                        lastUpdated: Date.now(),
                    };
                    this.priceCache[cgId] = price;
                    return price;
                }
                return this.priceCache[cgId] || {
                    symbol: asset.symbol,
                    address: asset.address,
                    priceUsd: 0,
                    change24h: 0,
                    lastUpdated: 0
                };
            });
        } catch (error) {
            console.error('[MarketService] Failed to fetch multi prices:', error);
            return [];
        }
    }

    static async fetchHistory(symbol: string, address?: string, chainId?: number, days: number = 7): Promise<ChartPoint[]> {
        try {
            const cgId = this.getCoinGeckoId(symbol, address, chainId);
            const response = await fetch(`${COINGECKO_API}/coins/${cgId}/market_chart?vs_currency=usd&days=${days}`);
            const data = await response.json();

            if (data.prices) {
                return data.prices.map((p: any) => ({
                    timestamp: p[0],
                    price: p[1],
                }));
            }
            return [];
        } catch (error) {
            console.error('[MarketService] Failed to fetch history:', error);
            return [];
        }
    }
}
