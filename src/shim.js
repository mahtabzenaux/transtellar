import 'react-native-get-random-values';
import { Buffer } from 'buffer';

global.Buffer = Buffer;

if (typeof process === 'undefined') {
    global.process = require('process');
} else {
    const bProcess = require('process');
    for (const p in bProcess) {
        if (!(p in process)) {
            process[p] = bProcess[p];
        }
    }
}

// Additional polyfills for ethers v6 if needed
if (typeof TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('text-encoding-polyfill');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
}
