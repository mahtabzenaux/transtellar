import { WalletService } from './WalletService';
import { StorageService } from './StorageService';

export interface DAppRequest {
    id: number;
    method: string;
    params: any[];
}

export class BridgeService {
    /**
     * Handle requests from the injected provider
     */
    static async handleRequest(request: DAppRequest): Promise<any> {
        console.log('Bridge Request:', request.method, request.params);

        switch (request.method) {
            case 'eth_requestAccounts':
            case 'eth_accounts':
                const settings = await StorageService.getSettings();
                if (!settings || !settings.activeWalletId) return [];

                // Ensure wallet is loaded in WalletService
                const address = await WalletService.loadWallet(settings.activeWalletId);
                return address ? [address] : [];

            case 'eth_chainId':
                const chainId = WalletService.getChainId();
                return '0x' + chainId.toString(16);

            case 'eth_sendTransaction':
                const txRequest = request.params[0];
                const tx = await WalletService.sendTransaction(
                    txRequest.to,
                    txRequest.value || '0',
                    txRequest.data
                );
                return tx ? tx.hash : null;

            case 'personal_sign':
                const message = request.params[0];
                return await WalletService.signMessage(message);

            case 'eth_blockNumber':
                const block = await WalletService.getProvider().getBlockNumber();
                return '0x' + block.toString(16);

            case 'eth_getBalance':
                const balance = await WalletService.getProvider().getBalance(request.params[0]);
                return '0x' + balance.toString(16);

            case 'eth_estimateGas':
                const gas = await WalletService.estimateGas(
                    request.params[0].to,
                    request.params[0].value || '0',
                    request.params[0].data
                );
                return '0x' + gas.toString(16);

            case 'eth_call':
                return await WalletService.getProvider().call(request.params[0]);

            default:
                throw new Error(`Method ${request.method} not supported`);
        }
    }
}
