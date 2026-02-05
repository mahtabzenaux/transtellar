import { NativeModules } from 'react-native';

const { SecureWindow } = NativeModules;

export const SecureWindowModule = {
    changeSecureWindow: (secure: boolean) => {
        if (SecureWindow) {
            SecureWindow.changeSecureWindow(secure);
        }
    }
};
