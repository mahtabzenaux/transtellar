import { ethers } from 'ethers';
import { Transaction, TransactionStatus, TransactionType } from './types';
import { MORALIS_API_KEY, MORALIS_BASE_URL } from '../../config/ApiConfig';

export class HistoryService {
    /**
     * Fetch native transactions for an address
     */
    static async fetchTransactions(
        address: string,
        chainId: number,
        cursor?: string
    ): Promise<{ results: Transaction[], nextCursor?: string }> {
        try {
            const chain = `0x${chainId.toString(16)}`;
            const url = `${MORALIS_BASE_URL}/${address}?chain=${chain}${cursor ? `&cursor=${cursor}` : ''}&order=DESC`;

            const response = await fetch(url, {
                headers: { 'X-API-Key': MORALIS_API_KEY }
            });
            const data = await response.json();

            if (!data.result) {
                console.warn(`[HistoryService] No results returned for ${address} on chain ${chainId}`);
                return { results: [] };
            }

            const results = data.result
                .map((tx: any) => this.normalizeTransaction(tx, chainId))
                .filter((tx: any) => tx && tx.hash); // Ensure we never return a null hash
            return { results, nextCursor: data.cursor };
        } catch (error) {
            console.error('[HistoryService] Failed to fetch transactions:', error);
            return { results: [] };
        }
    }

    /**
     * Fetch ERC20 token transfers for an address
     */
    static async fetchTokenTransfers(
        address: string,
        chainId: number,
        cursor?: string
    ): Promise<{ results: Transaction[], nextCursor?: string }> {
        try {
            const chain = `0x${chainId.toString(16)}`;
            const url = `${MORALIS_BASE_URL}/${address}/erc20/transfers?chain=${chain}${cursor ? `&cursor=${cursor}` : ''}`;

            const response = await fetch(url, {
                headers: { 'X-API-Key': MORALIS_API_KEY }
            });
            const data = await response.json();

            if (!data.result) {
                console.warn(`[HistoryService] No token transfers for ${address} on chain ${chainId}`);
                return { results: [] };
            }

            const results = data.result
                .map((tx: any) => this.normalizeTokenTransfer(tx, chainId))
                .filter((tx: any) => tx && tx.hash);
            return { results, nextCursor: data.cursor };
        } catch (error) {
            console.error('[HistoryService] Failed to fetch token transfers:', error);
            return { results: [] };
        }
    }

    private static normalizeTransaction(tx: any, chainId: number): Transaction {
        const hash = tx.hash || tx.transaction_hash;
        if (!hash) return null as any;

        return {
            hash,
            from: tx.from_address || '',
            to: tx.to_address || '',
            value: tx.value ? ethers.formatEther(tx.value) : '0.0',
            type: tx.input === '0x' ? 'send' : 'contract_interaction',
            status: 'confirmed',
            timestamp: tx.block_timestamp ? new Date(tx.block_timestamp).getTime() : Date.now(),
            chainId,
            blockNumber: tx.block_number ? parseInt(tx.block_number) : 0,
            confirmations: 0,
            gasPrice: tx.gas_price,
            gasUsed: tx.receipt_gas_used,
        };
    }

    private static normalizeTokenTransfer(tx: any, chainId: number): Transaction {
        const hash = tx.hash || tx.transaction_hash;
        if (!hash) return null as any;

        return {
            hash,
            from: tx.from_address || '',
            to: tx.to_address || '',
            value: tx.value ? ethers.formatUnits(tx.value, parseInt(tx.token_decimals || '18')) : '0.0',
            type: 'token_transfer',
            status: 'confirmed',
            timestamp: tx.block_timestamp ? new Date(tx.block_timestamp).getTime() : Date.now(),
            chainId,
            blockNumber: tx.block_number ? parseInt(tx.block_number) : 0,
            confirmations: 0,
            tokenSymbol: tx.token_symbol,
            tokenName: tx.token_name,
            tokenAddress: tx.token_address,
            tokenDecimals: tx.token_decimals ? parseInt(tx.token_decimals) : 18,
            tokenLogo: tx.token_logo,
        } as any;
    }
}
