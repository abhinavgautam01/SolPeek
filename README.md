# SolPeek

**A powerful mobile application for exploring Solana blockchain wallets, tokens, and transactions.**

SolPeek is a React Native mobile application built with Expo that allows users to explore any Solana wallet address, view balances and tokens, perform token swaps, and send SOL on both Devnet and Mainnet networks.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/abhinavgautam01/SolPeek)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0.33-000020.svg)](https://expo.dev/)

---

## Features

### Wallet Explorer
- Search and explore any Solana wallet address
- View real-time SOL balance
- Display all SPL tokens with amounts and USD values
- Show recent transaction history (last 10 transactions)
- Transaction success/failure indicators
- Direct links to Solscan for detailed blockchain views
- Address validation and error handling

### Token Swap
- Jupiter Aggregator v6 API integration
- Swap SOL to USDC (and vice versa) on Mainnet
- Real-time price feeds from multiple sources (Jupiter, CoinGecko)
- Configurable slippage tolerance (0.1%, 0.5%, 1.0%, 3.0%)
- Mobile Wallet Adapter integration for secure transaction signing
- Comprehensive error handling and user feedback
- Transaction confirmation with Solscan explorer links

### Send Tokens
- Transfer SOL to any Solana address
- Secure transaction signing via Mobile Wallet Adapter
- Transaction preview with network fees
- Address validation
- Balance checks before sending
- Transaction status tracking
- Solscan integration for transaction verification

### Favorites System
- Save frequently monitored wallet addresses
- Persistent storage across app sessions
- Quick access from favorites list
- Add/remove favorites with one tap
- Favorites count indicator

### Search History
- Automatic tracking of searched addresses
- Store last 20 searches
- Quick re-search from history
- Clear history option
- Persistent storage

### Network Switching
- Toggle between Devnet and Mainnet
- Visual network indicator in all screens
- Automatic RPC endpoint switching
- Confirmation modal before switching
- Network-specific features (swaps on Mainnet only)

### Real-time Price Feeds
- Live SOL price in USD
- Multiple API sources with fallback
- Price refresh every 15 seconds
- Graceful degradation on API failures

### User Interface
- Terminal-inspired cyberpunk design
- Dark theme optimized for OLED screens
- Monospace fonts for blockchain data
- Smooth animations and transitions
- Responsive layout for all screen sizes

---

## Tech Stack

### Frontend Framework
- **React Native** 0.81.5 - Mobile framework
- **Expo** ~54.0.33 - Development platform
- **TypeScript** ~5.9.2 - Type safety
- **Expo Router** ~6.0.23 - File-based routing

### Blockchain Integration
- **@solana/web3.js** ^1.98.4 - Solana JavaScript SDK
- **@solana-mobile/mobile-wallet-adapter-protocol** ^2.2.5 - Mobile wallet integration
- **@solana-mobile/mobile-wallet-adapter-protocol-web3js** ^2.2.5 - Web3.js adapter
- **Jupiter Aggregator** v6 API - Token swap aggregation

### State Management
- **Zustand** ^5.0.11 - Lightweight state management
- **@react-native-async-storage/async-storage** 2.2.0 - Persistent storage

### Networking
- **axios** - HTTP client with better React Native support
- **Native fetch** - Fallback for RPC calls

### UI Components & Styling
- **@expo/vector-icons** ^15.0.3 - Icon library
- **expo-linear-gradient** ~15.0.8 - Gradient backgrounds
- **@react-native-masked-view/masked-view** 0.3.2 - Masked views
- **react-native-safe-area-context** ^5.6.2 - Safe area handling

### Development Tools
- **babel-plugin-module-resolver** ^5.0.2 - Import aliasing
- **TypeScript ESLint** - Code quality

---

## Installation

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development)
- Xcode (for iOS development on macOS)
- A Solana-compatible mobile wallet app (Phantom, Solflare, etc.)

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/abhinavgautam01/SolPeek.git
cd SolPeek
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm start
```

4. **Run on your device**

For Android:
```bash
npm run android
```

For iOS:
```bash
npm run ios
```

For web (UI testing only, limited functionality):
```bash
npm run web
```

### Building for Production

**Android APK:**
```bash
eas build --platform android --profile preview
```

**iOS:**
```bash
eas build --platform ios --profile preview
```

---

## Usage Guide

### Exploring Wallets
1. Launch the app and navigate to the "Wallet" tab
2. Enter a Solana wallet address (32-44 characters)
3. Tap the "Search" button
4. View balance, tokens, and recent transactions
5. Tap any transaction to view details on Solscan
6. Add to favorites by tapping the star icon

### Swapping Tokens
1. Navigate to the "Swap" tab
2. Ensure you are connected to **Mainnet** (check network indicator)
3. Tap "Connect Wallet" to connect your mobile wallet
4. Enter the amount of SOL or USDC to swap
5. Select slippage tolerance (recommended: 0.5% - 1.0%)
6. Review the estimated output amount
7. Tap "EXECUTE_SWAP"
8. Approve the transaction in your wallet app
9. Wait for confirmation

### Sending SOL
1. Navigate to the "Send Tokens" tab
2. Tap "Connect Wallet"
3. Enter the recipient's Solana address
4. Enter the amount of SOL to send
5. Review the transaction details and network fee
6. Tap "INITIATE_TRANSFER"
7. Approve in your wallet app
8. View transaction status and confirmation

### Switching Networks
1. Go to any screen with the network indicator
2. Tap the network badge (DEVNET / MAINNET) in the top-right corner
3. Confirm the network switch in the modal
4. App will refresh with new network data

### Managing Favorites
- **Add to favorites**: Search for a wallet, then tap the star icon
- **View favorites**: Navigate to Settings > Favorites
- **Remove from favorites**: Tap the star icon again on any favorited wallet

---

## Project Structure

```
SolPeek/
├── app/                              # Expo Router screens
│   ├── (tabs)/                       # Tab-based navigation
│   │   ├── index.tsx                # Wallet explorer screen
│   │   ├── swap.tsx                 # Token swap screen
│   │   ├── sendtokens.tsx           # Send tokens screen
│   │   ├── settings.tsx             # Settings and favorites
│   │   └── _layout.tsx              # Tab navigation layout
│   ├── token/
│   │   └── [mint].tsx               # Individual token detail screen
│   ├── fav_wallet/
│   │   └── watchlist.tsx            # Favorites list screen
│   ├── _layout.tsx                  # Root layout with providers
│   └── +not-found.tsx               # 404 screen
├── src/
│   ├── components/                  # Reusable UI components
│   │   ├── ConnectButton.tsx        # Wallet connection button
│   │   ├── ConnectedWalletCard.tsx  # Connected wallet display
│   │   ├── ConfirmModal.tsx         # Confirmation modal
│   │   └── FavoriteButton.tsx       # Favorite toggle button
│   ├── hooks/                       # Custom React hooks
│   │   └── useWallet.ts             # Wallet adapter and transactions
│   ├── store/                       # State management
│   │   └── wallet-store.ts          # Zustand global store
│   ├── styles/                      # Global styles
│   │   └── styles.tsx               # Shared style definitions
│   ├── utils/                       # Utility functions
│   │   └── index.ts                 # RPC helpers, formatters
│   └── polyfills.ts                 # React Native polyfills
├── assets/                          # Static assets
│   ├── images/                      # Images
│   └── fonts/                       # Custom fonts
├── android/                         # Android native code
├── ios/                             # iOS native code
├── app.json                         # Expo configuration
├── eas.json                         # Expo Application Services config
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies and scripts
└── README.md                        # This file
```

---

## Configuration

### RPC Endpoints
The app uses the following RPC endpoints (configured in `src/utils/index.ts`):

- **Devnet**: `https://api.devnet.solana.com`
- **Mainnet**: `https://api.mainnet-beta.solana.com`

You can customize these endpoints by modifying the `getRpcUrl()` function.

### Supported Tokens
Currently configured tokens for swapping:
- **SOL**: Native Solana token (9 decimals)
- **USDC**: USD Coin (6 decimals)

Token configurations can be extended in `app/(tabs)/swap.tsx`.

### Network Settings
- Default network: **Devnet** (for safety)
- Network state persisted via AsyncStorage
- Switch anytime via the network indicator button

---

## Development

### Running the Development Server
```bash
npm start
```

This starts the Expo development server with options to:
- Press `a` for Android
- Press `i` for iOS
- Press `w` for web
- Press `r` to reload
- Press `m` to toggle menu

### Debugging
- Use React DevTools for component inspection
- Use Flipper for network and state debugging
- Console logs are visible in terminal and via remote debugging
- Use `__DEV__` flag for development-only code

### Key Development Files

**State Management:**
- `src/store/wallet-store.ts` - Global state for favorites, search history, network selection, and wallet auth

**Wallet Operations:**
- `src/hooks/useWallet.ts` - Custom hook for wallet connection, transactions, and swaps
  - `authorize()` - Connect wallet
  - `sendSOL()` - Transfer SOL tokens
  - `executeSwap()` - Execute Jupiter swaps

**Utilities:**
- `src/utils/index.ts` - RPC endpoint getters, amount formatters, token address constants

**Main Screens:**
- `app/(tabs)/index.tsx` - Wallet explorer with search and transaction history
- `app/(tabs)/swap.tsx` - Swap interface with Jupiter integration
- `app/(tabs)/sendtokens.tsx` - Send tokens with Mobile Wallet Adapter

### Adding New Features
1. Create new screen file in `app/` or `app/(tabs)/`
2. Add necessary state to `src/store/wallet-store.ts`
3. Use existing components from `src/components/`
4. Follow TypeScript strict typing
5. Test on both Android and iOS
6. Update README with new feature documentation

### Code Style Guidelines
- Use TypeScript for all new files
- Follow React hooks patterns (no class components)
- Use functional components with proper typing
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use Zustand for global state, useState for local state
- Follow existing naming conventions
- Add comments for complex logic
- Use monospace fonts for blockchain addresses and amounts

---

## Known Issues

### Jupiter API DNS Resolution Issue

**Current Status:** The Jupiter swap functionality is fully implemented but currently non-functional due to infrastructure issues on Jupiter's end.

**Technical Details:**
- The Jupiter quote API endpoint (`quote-api.jup.ag`) does not resolve in DNS
- This is a Jupiter infrastructure problem, not an app issue
- The main domain `api.jup.ag` works, but the subdomain for quotes doesn't exist
- All swap code is production-ready and will work immediately when Jupiter fixes their DNS

**Error Message:**
```
Unable to reach Jupiter API. Please check your internet connection.
```

**User Impact:**
- Token swaps will fail with network errors
- Price feeds may intermittently fail (CoinGecko fallback works)

**Workaround:**
Users can use Jupiter's official web application at [jup.ag](https://jup.ag) for token swaps.

**Resolution:**
No code changes required. Once Jupiter resolves their DNS issues, swaps will work automatically.

### Other Limitations
- **Swaps only work on Mainnet** - Jupiter does not support Devnet swaps
- **Mobile Wallet Adapter** - Requires compatible wallet apps (Phantom, Solflare, etc.)
- **Network connectivity** - Requires stable internet for RPC calls
- **Rate limiting** - Public RPC endpoints may rate-limit requests

---

## Troubleshooting

### App won't start
- Ensure Node.js 18+ is installed
- Delete `node_modules` and run `npm install` again
- Clear Expo cache: `expo start -c`

### Wallet won't connect
- Ensure you have a compatible wallet app installed
- Grant necessary permissions to both apps
- Try disconnecting and reconnecting
- Restart both apps

### Transactions failing
- Check you're on the correct network (Mainnet for swaps)
- Ensure sufficient balance for transaction + fees
- Verify internet connectivity
- Check Solana network status

### Swap not working
- Currently experiencing Jupiter API issues (see Known Issues)
- Ensure you're on Mainnet
- Check slippage tolerance (increase if market is volatile)
- Wait for Jupiter to resolve DNS issues

---

## Contributing

Contributions are welcome! Here's how you can help:

### Reporting Bugs
1. Check existing issues first
2. Open a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Device and OS information

### Suggesting Features
1. Open an issue labeled "feature request"
2. Describe the feature and use case
3. Explain why it would be valuable

### Submitting Pull Requests
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes following code style guidelines
4. Test thoroughly on both Android and iOS
5. Commit with clear messages: `git commit -m 'Add feature: description'`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Open a Pull Request with:
   - Description of changes
   - Related issue numbers
   - Testing performed
   - Screenshots/videos if UI changes

### Development Guidelines
- Follow existing code patterns and style
- Add TypeScript types for all new code
- Write meaningful commit messages
- Keep PRs focused on single features/fixes
- Update documentation for new features
- Ensure no TypeScript errors
- Test on multiple devices if possible

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

### MIT License Summary
- Commercial use allowed
- Modification allowed
- Distribution allowed
- Private use allowed
- No liability or warranty

---

## Acknowledgments

This project was made possible by:

- **Solana Foundation** - For building an incredible blockchain platform
- **Jupiter Aggregator** - For providing swap aggregation APIs
- **Expo Team** - For the excellent React Native development framework
- **Solana Mobile** - For the Mobile Wallet Adapter standard
- **CoinGecko** - For providing reliable price data APIs
- **Solscan** - For blockchain explorer integration
- **Open Source Community** - For the amazing tools and libraries

---

## Contact & Support

### Author
**Abhinav Gautam**
- GitHub: [@abhinavgautam01](https://github.com/abhinavgautam01)
- Expo: [@abhinavgautam01](https://expo.dev/@abhinavgautam01)

### Support Channels
- **Issues**: [GitHub Issues](https://github.com/abhinavgautam01/SolPeek/issues)

### Getting Help
1. Check this README for common questions
2. Review [Known Issues](#known-issues) section
3. Search existing issues
4. Open a new issue with detailed information

---

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Wallet explorer functionality
- Token swap integration (Jupiter v6)
- Send SOL functionality
- Favorites system
- Search history
- Network switching (Devnet/Mainnet)
- Real-time price feeds
- Mobile Wallet Adapter integration
- Cyberpunk UI theme
- Transaction history viewer
- Solscan integration

---

<div align="center">

**Made for the Solana ecosystem**

⭐ Star this repository if you find it useful ⭐

[Report Bug](https://github.com/abhinavgautam01/SolPeek/issues) · [Request Feature](https://github.com/abhinavgautam01/SolPeek/issues)

</div>
