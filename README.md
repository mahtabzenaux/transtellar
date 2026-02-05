# Transtellar Wallet
### The Secure, Non-Custodial Gateway to the Decentralized Web

![Transtellar Banner](src/assets/placeholder.png)

Transtellar is a production-grade, high-security mobile cryptocurrency wallet built with **React Native** and **TypeScript**. Designed for both ease of use and maximum protection, it provides a seamless interface for managing assets across multiple EVM-compatible chains (Ethereum, Polygon, Optimism, Arbitrum, Base) while leveraging hardware-backed security modules for key storage.

---

## 🚀 Key Features

### 🛡️ **Defense-in-Depth Security**
Transtellar implements a multi-layered security architecture designed to resist both local and remote attacks:

*   **Hardware-Backed Encryption**: All private keys, mnemonics, and sensitive metadata are encrypted at rest using the Android Keystore system (utilizing Trusted Execution Environment / Secure Enclave where available).
*   **Runtime Tamper Detection**: The app performs integrity checks on startup to detect rooted devices, emulators, or compromised runtime environments.
*   **Anti-Surveillance**: `FLAG_SECURE` is enforced app-wide to block screenshots, screen recording, and "Recent Apps" previews, protecting your data from spyware.
*   **Biometric Vault**: A mandatory global lock requires Biometric (Fingerprint/Face) or Device PIN authentication to access the wallet or sign transactions.
*   **Memory Hygiene**: Sensitive variables are explicitly cleared from memory; the clipboard is automatically purged 60 seconds after copying addresses or keys.
*   **Network Hardening**: Strict HTTPS enforcement prevents Man-in-the-Middle (MitM) attacks; API keys are injected at build time.

### 🌐 **Advanced Web3 Capabilities**
*   **Multi-Chain Support**: Native support for **Ethereum Mainnet**, **Polygon**, **Optimism**, **Arbitrum One**, and **Base**, plus their respective testnets (Sepolia, Mumbai, etc.).
*   **Integrated DApp Browser**: A fully functional Web3 browser capability allows you to connect to decentralized applications (Uniswap, OpenSea, etc.) directly within the app using standard provider injection.
*   **HD Wallet Architecture**: Fully BIP-39 compliant. Generate or import standard 12/24-word recovery phrases. Derive multiple accounts from a single seed.
*   **Token Management**: Auto-discovery of native assets; easily add custom ERC-20 tokens by contract address.

### 🎨 **Premium User Experience**
*   **Gothic-Celestial Design**: A unique, dark-themed aesthetic featuring glassmorphism, fluid animations, and a cohesive design system (`src/theme/theme.ts`).
*   **Animated Interactions**: From the spring-loaded splash screen to the gesture-driven dashboard, every interaction is polished for 60fps performance.
*   **Smart Dashboard**: A sticky header and tabbed interface allow quick switching between Asset views and Transaction History.

---

## 📂 Project Structure

The codebase is organized for scalability and separation of concerns:

```
src/
├── components/       # Reusable UI atoms (Buttons, Cards, Inputs)
├── config/           # App-wide configuration (API Keys, Constants)
├── context/          # React Contexts (Auth, Alert, Theme)
├── navigation/       # React Navigation setup (Stacks, Tab bars)
├── screens/          # Application screens
│   ├── Dashboard/    # Main wallet view
│   ├── Onboarding/   # Setup & Import flows
│   ├── Operations/   # Send, Receive, Swap
│   └── Settings/     # Security & Wallet management
├── services/         # Business logic & External integrations
│   ├── data/         # SyncManager, HistoryService, Database
│   ├── Encryption/   # Key management & Cipher logic
│   └── Wallet/       # Ethers.js wrappers & Chain interactions
├── theme/            # Design tokens (Colors, Typography, Spacing)
└── utils/            # Helper functions (Formatting, Validation)
```

---

## 🛠️ Setup & Installation

### Prerequisites
*   **Node.js**: v18 or newer
*   **JDK**: Java 17
*   **Android Studio**: with Android SDK (API 34)
*   **Yarn** or **NPM**

### 1. Clone & Install
```bash
git clone https://github.com/mahtab2003/transtellar.git
cd transtellar
npm install
# OR
yarn install
```
Create another react-native project from scratch and install all the dependencies.
```
npx @react-native-community/cli@latest init AwesomeProject
```
Copy all the files from the transtellar folder to the AwesomeProject folder.

### 2. Environment Configuration
The application requires API keys for blockchain providers (Infura/Alchemy). Edit `src/config/ApiConfig.tsx`:

```typescript
// src/config/ApiConfig.tsx
export const INFURA_PROJECT_ID = 'YOUR_INFURA_KEY';
export const ALCHEMY_API_KEY = 'YOUR_ALCHEMY_KEY';
```

### 3. Run Locally
Start the Metro bundler and launch the Android app:

```bash
# Terminal 1
npm start

# Terminal 2
npm run android
```

---

## 📦 Building for Production

To generate a secure, signed APK or Android App Bundle (AAB) for the Google Play Store:

### 1. Generate Signing Keys
Create a production keystore. **WARNING: Keep this file secure. If lost, you cannot update your app.**

```bash
cd android/app
keytool -genkeypair -v \
  -keystore transtellar-release.keystore \
  -alias transtellar-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=Transtellar, OU=Engineering, O=NxtsDev, L=London, S=London, C=UK"
```

### 2. Set Up Gradle Variables
Configure your signing credentials. You can set them in `~/.gradle/gradle.properties` or pass them via command line:

```properties
TRANSTELLAR_RELEASE_STORE_FILE=transtellar-release.keystore
TRANSTELLAR_RELEASE_KEY_ALIAS=transtellar-key-alias
# Pass passwords via CI/ENV for better security
```

### 3. Generate Artifacts
Run the release build command. This triggers **R8/ProGuard** code shrinking and obfuscation automatically.

```bash
cd android
./gradlew clean assembleRelease bundleRelease \
  -PTRANSTELLAR_RELEASE_STORE_PASSWORD=your_secure_password \
  -PTRANSTELLAR_RELEASE_KEY_PASSWORD=your_secure_password
```

**Output:**
*   **APK**: `android/app/build/outputs/apk/release/app-release.apk`
*   **Bundle**: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 📱 Application Screens

| Screen | Description |
| :--- | :--- |
| **Welcome** | Animated intro and entry point for new users. |
| **Create/Import** | Secure flows for generating new seeds or restoring from mnemonics. |
| **Dashboard** | The central hub. View total balance, assets, and recent activity. |
| **AssetDetails** | Deep dive into a specific token's chart and history. |
| **Send/Receive** | QR code scanning and transaction composition forms. |
| **DAppBrowser** | A Webview wrapper with injected `window.ethereum` provider. |
| **SecuritySettings** | Manage PIN, Biometrics, and Auto-Lock timeout preferences. |
| **WalletManager** | Create, switch, or remove multiple wallet accounts. |

---

## 📄 License

Copyright © 2026 NxtsDev.
Licensed under the MIT License. See `LICENSE` for details.
