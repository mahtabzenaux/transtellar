import { ethers } from 'ethers';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'dropped';

export type TransactionType = 'send' | 'receive' | 'contract_interaction' | 'token_transfer' | 'nft_transfer' | 'swap';

export interface BaseTransaction {
    hash: string;
    from: string;
    to: string;
    value: string; // in human-readable units (ETH, etc.)
    type: TransactionType;
    status: TransactionStatus;
    timestamp: number;
    chainId: number;
    blockNumber?: number;
    confirmations: number;
    gasPrice?: string;
    gasUsed?: string;
    feeEth?: string;
}

export interface TokenTransfer extends BaseTransaction {
    tokenSymbol: string;
    tokenName: string;
    tokenAddress: string;
    tokenDecimals: number;
    tokenLogo?: string;
}

export type Transaction = BaseTransaction | TokenTransfer;

export interface AssetPrice {
    symbol: string;
    address?: string; // empty for native
    priceUsd: number;
    change24h: number;
    marketCap?: number;
    volume24h?: number;
    lastUpdated: number;
}

export interface ChartPoint {
    timestamp: number;
    price: number;
}

export interface WalletSyncState {
    lastSyncedBlock: number;
    lastSyncedTimestamp: number;
    cursor?: string; // For Moralis pagination
}

export interface NetworkSyncState {
    [walletAddress: string]: WalletSyncState;
}

export interface StorageSyncState {
    [chainId: number]: NetworkSyncState;
}
