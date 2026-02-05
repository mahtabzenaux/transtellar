import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GothicAlert, AlertProps } from '../components/GothicAlert';

interface AlertState {
    visible: boolean;
    title: string;
    message?: string;
    buttons?: AlertProps['buttons'];
}

interface AlertContextType {
    showAlert: (title: string, message?: string, buttons?: AlertProps['buttons']) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [alertConfig, setAlertConfig] = useState<AlertState>({
        visible: false,
        title: '',
        message: '',
        buttons: []
    });

    const showAlert = useCallback((title: string, message?: string, buttons?: AlertProps['buttons']) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            buttons
        });
    }, []);

    const hideAlert = useCallback(() => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <GothicAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                onClose={hideAlert}
            />
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (context === undefined) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};
