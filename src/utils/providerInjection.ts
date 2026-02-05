export const PROVIDER_INJECTION = `
(function() {
    const bridge = window.ReactNativeWebView;

    class EventEmitter {
        constructor() {
            this.events = {};
        }
        on(event, listener) {
            if (!this.events[event]) this.events[event] = [];
            this.events[event].push(listener);
        }
        emit(event, ...args) {
            if (this.events[event]) {
                this.events[event].forEach(listener => listener(...args));
            }
        }
        removeListener(event, listener) {
            if (this.events[event]) {
                this.events[event] = this.events[event].filter(l => l !== listener);
            }
        }
    }

    class EthereumProvider extends EventEmitter {
        constructor() {
            super();
            this.isMetaMask = true;
            this.chainId = '0xaa36a7'; // Sepolia default
            this.networkVersion = '11155111';
            this.selectedAddress = null;
            this._requestId = 0;
            this._promises = {};

            window.addEventListener('message', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'wallet_response') {
                        const promise = this._promises[data.id];
                        if (promise) {
                            if (data.error) {
                                promise.reject(new Error(data.error));
                            } else {
                                promise.resolve(data.result);
                            }
                            delete this._promises[data.id];
                        }
                    } else if (data.type === 'wallet_event') {
                        // Handle events from native side
                        if (data.event === 'accountsChanged') {
                            this.selectedAddress = data.data[0];
                            this.emit('accountsChanged', data.data);
                        } else if (data.event === 'chainChanged') {
                            this.chainId = data.data;
                            this.emit('chainChanged', data.data);
                        }
                    }
                } catch (e) {}
            });
        }

        request(args) {
            return new Promise((resolve, reject) => {
                const id = this._requestId++;
                this._promises[id] = { resolve, reject };
                
                bridge.postMessage(JSON.stringify({
                    type: 'wallet_request',
                    id,
                    method: args.method,
                    params: args.params
                }));
            });
        }

        enable() {
            return this.request({ method: 'eth_requestAccounts' });
        }

        send(method, params) {
            if (typeof method === 'string') {
                return this.request({ method, params });
            }
            return this.request(method);
        }

        sendAsync(payload, callback) {
            this.request(payload)
                .then(result => callback(null, { id: payload.id, jsonrpc: '2.0', result }))
                .catch(error => callback(error));
        }
    }

    window.ethereum = new EthereumProvider();
    window.web3 = { currentProvider: window.ethereum };
    
    window.dispatchEvent(new Event('ethereum#initialized'));
})();
`;
