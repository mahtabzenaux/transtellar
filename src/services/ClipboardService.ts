import Clipboard from '@react-native-clipboard/clipboard';

export class ClipboardService {
    private static clearTimer: NodeJS.Timeout | null = null;

    /**
     * Set sensitive string to clipboard and schedule auto-clear
     * @param text The text to copy
     * @param timeoutMs Time in milliseconds before clearing (default 60s)
     */
    static async setSensitiveString(text: string, timeoutMs: number = 60000) {
        // Clear any existing timer
        if (this.clearTimer) {
            clearTimeout(this.clearTimer);
            this.clearTimer = null;
        }

        Clipboard.setString(text);

        this.clearTimer = setTimeout(async () => {
            const currentContent = await Clipboard.getString();
            // Only clear if the content is still what we put there
            // This prevents clearing something the user manually copied later
            if (currentContent === text) {
                Clipboard.setString('');
                console.log('[ClipboardService] Sensitive data auto-cleared');
            }
            this.clearTimer = null;
        }, timeoutMs);
    }

    /**
     * Immediately clear the clipboard
     */
    static clear() {
        if (this.clearTimer) {
            clearTimeout(this.clearTimer);
            this.clearTimer = null;
        }
        Clipboard.setString('');
    }
}
