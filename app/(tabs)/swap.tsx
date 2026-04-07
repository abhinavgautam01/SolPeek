import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { COLORS, s } from "../../src/styles/styles";
import { ConnectButton } from "../../src/components/ConnectButton";
import { useWallet } from "../../src/hooks/useWallet";
import { ConnectedWalletCard } from "../../src/components/ConnectedWalletCard";
import { useWalletStore } from "../../src/store/wallet-store";

const TOKEN_DATA: { [key: string]: { id: string; logo: string } } = {
  SOL: {
    id: "So11111111111111111111111111111111111111112",
    logo: "https://api.phantom.app/image-proxy/?image=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2Fsolana-labs%2Ftoken-list%40main%2Fassets%2Fmainnet%2FSo11111111111111111111111111111111111111112%2Flogo.png&fit=cover&width=128&height=128",
  },
  USDC: {
    id: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    logo: "https://api.phantom.app/image-proxy/?image=https%3A%2F%2Fraw.githubusercontent.com%2Fsolana-labs%2Ftoken-list%2Fmain%2Fassets%2Fmainnet%2FEPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v%2Flogo.png&fit=cover&width=128&height=128",
  },
};

export default function SwapScreen() {
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const isDevnet = useWalletStore((s) => s.isDevnet);

  // Swap State
  const [fromAmount, setFromAmount] = useState("1.00");
  const [fromToken, setFromToken] = useState("SOL");
  const [toToken, setToToken] = useState("USDC");
  const [solPrice, setSolPrice] = useState<number>(0);
  const [slippageBps, setSlippageBps] = useState(50); // 0.5% default

  const isConnected = wallet.connected;

  // Price Fetching Logic - Using axios with multiple fallback sources
  const fetchPrice = async () => {
    setPriceLoading(true);

    try {
      // Try Jupiter API first
      try {
        const response = await axios.get(
          "https://api.jup.ag/price/v2?ids=SOL",
          {
            timeout: 10000,
            headers: {
              "Accept": "application/json",
            },
          }
        );

        const price = response.data?.data?.SOL?.price ?? 0;
        if (price > 0) {
          setSolPrice(price);
          console.log("Jupiter price fetched:", price);
          setPriceLoading(false);
          return;
        }
      } catch (jupError) {
        console.log("Jupiter price API failed, trying fallback...");
      }

      // Fallback to CoinGecko
      try {
        const response = await axios.get(
          "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
          {
            timeout: 10000,
            headers: {
              "Accept": "application/json",
            },
          }
        );

        const price = response.data?.solana?.usd ?? 0;
        if (price > 0) {
          setSolPrice(price);
          console.log("CoinGecko price fetched:", price);
          setPriceLoading(false);
          return;
        }
      } catch (geckoError) {
        console.log("CoinGecko API failed");
      }

      // If all APIs fail, use a reasonable default
      if (solPrice === 0) {
        setSolPrice(150); // Default fallback price
        console.warn("Using default SOL price");
      }
    } catch (err) {
      console.warn("Price sync failed:", err);
      if (solPrice === 0) {
        setSolPrice(150); // Default fallback
      }
    } finally {
      setPriceLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 15000);
    return () => clearInterval(interval);
  }, []);

  const swapDirection = () => {
    const prev = fromToken;
    setFromToken(toToken);
    setToToken(prev);
  };

  const handleAction = async () => {
    if (!isConnected) {
      try {
        await wallet.connect();
      } catch (e: any) {
        Alert.alert("CONNECTION_FAILED", e.message || "Wallet connection cancelled");
      }
      return;
    }

    // Validation
    const amount = parseFloat(fromAmount || "0");
    if (amount <= 0) {
      Alert.alert("INVALID_AMOUNT", "Please enter a valid amount greater than 0.");
      return;
    }

    setLoading(true);
    try {
      // Convert amount to lamports/smallest unit based on token
      let amountInSmallestUnit: number;
      if (fromToken === "SOL") {
        amountInSmallestUnit = Math.floor(amount * 1_000_000_000); // SOL has 9 decimals
      } else {
        amountInSmallestUnit = Math.floor(amount * 1_000_000); // USDC has 6 decimals
      }

      const inputMint = TOKEN_DATA[fromToken].id;
      const outputMint = TOKEN_DATA[toToken].id;

      console.log("Executing swap:", {
        from: fromToken,
        to: toToken,
        amount: amountInSmallestUnit,
        slippage: slippageBps,
      });

      const result = await wallet.executeSwap(
        inputMint,
        outputMint,
        amountInSmallestUnit,
        slippageBps,
      );

      Alert.alert(
        "SWAP_SUCCESS",
        `Transaction confirmed!\n\nSignature: ${result.signature.slice(0, 8)}...${result.signature.slice(-8)}\n\nView on Solscan?`,
        [
          { text: "Close", style: "cancel" },
          {
            text: "View",
            onPress: () =>
              Alert.alert("Opening...", `https://solscan.io/tx/${result.signature}`),
          },
        ],
      );

      // Reset form
      setFromAmount("1.00");
    } catch (e: any) {
      console.error("Swap error:", e);
      
      let errorMessage = e.message || "Unknown error occurred";
      let errorTitle = "SWAP_FAILED";
      
      // Parse common errors with more detail
      if (errorMessage.includes("only available on MAINNET") || errorMessage.includes("Jupiter swaps are only")) {
        errorTitle = "MAINNET_REQUIRED";
        errorMessage = "Jupiter swaps are only available on MAINNET. Please switch to mainnet in the Wallet tab and try again.";
      } else if (errorMessage.includes("Unable to connect to Jupiter API") || errorMessage.includes("Network/DNS issues")) {
        errorTitle = "JUPITER_UNAVAILABLE";
        errorMessage = "⚠️ Jupiter API is currently unreachable.\n\n" +
          "This is a known issue with Jupiter's DNS (quote-api.jup.ag doesn't resolve).\n\n" +
          "Options:\n" +
          "• Use Jupiter's web app at jup.ag\n" +
          "• Wait for Jupiter to fix their infrastructure\n" +
          "• Try a different network (WiFi/mobile data)\n\n" +
          "Your SolPeek app is working fine - it's Jupiter's servers that are down.";
      } else if (errorMessage.includes("Unable to reach Jupiter") || errorMessage.includes("Network Error")) {
        errorTitle = "CONNECTION_ERROR";
        errorMessage = "Cannot reach Jupiter's servers. This is likely due to:\n\n" +
          "• Jupiter API infrastructure issues (their DNS is not resolving)\n" +
          "• Network connectivity problems\n\n" +
          "Please try:\n" +
          "1. Switching networks (WiFi ↔️ Mobile data)\n" +
          "2. Using Jupiter's web app at jup.ag\n" +
          "3. Waiting a few minutes and trying again";
      } else if (errorMessage.includes("timed out")) {
        errorTitle = "TIMEOUT_ERROR";
        errorMessage = "Request timed out after 30 seconds. Jupiter's API may be slow or unavailable.";
      } else if (errorMessage.includes("Quote failed")) {
        errorTitle = "QUOTE_ERROR";
        errorMessage = "Unable to get swap quote. The route may not be available or the amount may be too small.";
      } else if (errorMessage.includes("User rejected") || errorMessage.includes("User cancelled")) {
        errorTitle = "CANCELLED";
        errorMessage = "Transaction was cancelled by user.";
      } else if (errorMessage.includes("Insufficient")) {
        errorTitle = "INSUFFICIENT_BALANCE";
        errorMessage = "Insufficient balance for this swap.";
      } else if (errorMessage.includes("Wallet not connected")) {
        errorTitle = "CONNECTION_ERROR";
        errorMessage = "Please connect your wallet first.";
      }

      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const amountNum = parseFloat(fromAmount || "0");
  const displayUsdValue =
    fromToken === "SOL"
      ? (amountNum * solPrice).toFixed(2)
      : amountNum.toFixed(2);
  const estimatedReceive =
    fromToken === "SOL"
      ? (amountNum * solPrice).toFixed(2)
      : solPrice > 0
        ? (amountNum / solPrice).toFixed(4)
        : "0.00";

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {/* NEW THEMED HEADER SECTION */}
        <View style={{ marginBottom: 30 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <View style={{ flexDirection: "row" }}>
              <Text style={s.appname_first}>ASSET</Text>
              <Text style={s.appname_second}>_SWAP</Text>
            </View>
            <ConnectButton
              connected={wallet.connected}
              connecting={wallet.connecting}
              publicKey={wallet.publicKey ?? null}
              onConnect={wallet.connect}
              onDisconnect={wallet.disconnect}
            />
          </View>
          <View
            style={{
              height: 1,
              backgroundColor: COLORS.line,
              width: "30%",
              marginBottom: 8,
            }}
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={s.subtitle}>Jupiter Aggregator Core</Text>
            {solPrice > 0 && solPrice !== 150 && (
              <View style={{ 
                width: 6, 
                height: 6, 
                borderRadius: 3, 
                backgroundColor: COLORS.green 
              }} />
            )}
          </View>
        </View>

        {/* DEVNET WARNING */}
        {isDevnet && (
          <View
            style={{
              marginBottom: 20,
              padding: 15,
              backgroundColor: "rgba(255, 193, 7, 0.1)",
              borderWidth: 1,
              borderColor: "#FFC107",
              borderStyle: "dashed",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons name="warning" size={16} color="#FFC107" />
              <Text
                style={{
                  color: "#FFC107",
                  fontSize: 10,
                  fontFamily: "monospace",
                  fontWeight: "800",
                  flex: 1,
                }}
              >
                DEVNET_MODE: Jupiter swaps only work on MAINNET. Switch network to use this feature.
              </Text>
            </View>
          </View>
        )}

        {/* JUPITER API STATUS INFO */}
        {!isDevnet && (
          <View
            style={{
              marginBottom: 20,
              padding: 12,
              backgroundColor: "rgba(255, 87, 51, 0.05)",
              borderWidth: 1,
              borderColor: "rgba(255, 87, 51, 0.3)",
              borderStyle: "dashed",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
              <Ionicons name="information-circle-outline" size={14} color="#FF5733" style={{ marginTop: 1 }} />
              <Text
                style={{
                  color: COLORS.muted,
                  fontSize: 9,
                  fontFamily: "monospace",
                  flex: 1,
                  lineHeight: 14,
                }}
              >
                NOTE: Jupiter API (quote-api.jup.ag) has DNS issues. Swaps may fail until Jupiter fixes their infrastructure. Use jup.ag web app as alternative.
              </Text>
            </View>
          </View>
        )}

        {/* PAYING CARD */}
        <View style={s.swapcard}>
          <Text style={s.label}>PAYING</Text>
          <View style={s.cardHeader}>
            <TouchableOpacity style={s.tokenSelector} onPress={swapDirection}>
              <Image
                source={{ uri: TOKEN_DATA[fromToken].logo }}
                style={s.tokenIconImage}
              />
              <Text style={s.tokenName}>{fromToken}</Text>
              <Ionicons name="swap-horizontal" size={12} color={COLORS.muted} />
            </TouchableOpacity>
            <TextInput
              style={s.amountInput}
              value={fromAmount}
              onChangeText={setFromAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={COLORS.line}
            />
          </View>
          <View style={s.cardFooter}>
            <Text style={s.balanceText}>
              RATE: 1 {fromToken} = $
              {fromToken === "SOL" ? solPrice.toFixed(2) : "1.00"}
              {solPrice === 150 && fromToken === "SOL" && (
                <Text style={{ fontSize: 8, color: COLORS.muted }}> (est.)</Text>
              )}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {priceLoading && (
                <ActivityIndicator
                  size="small"
                  color={COLORS.muted}
                  style={{ marginRight: 8 }}
                />
              )}
              <Text style={s.usdText}>≈ ${displayUsdValue}</Text>
            </View>
          </View>
        </View>

        {/* INTERSECTION */}
        <View style={s.arrowContainer}>
          <TouchableOpacity style={s.swapArrow} onPress={swapDirection}>
            <Ionicons name="arrow-down-sharp" size={20} color={COLORS.green} />
          </TouchableOpacity>
        </View>

        {/* RECEIVING CARD */}
        <View style={[s.swapcard, { marginTop: -1 }]}>
          <Text style={s.label}>RECEIVING</Text>
          <View style={s.cardHeader}>
            <TouchableOpacity style={s.tokenSelector} disabled>
              <Image
                source={{ uri: TOKEN_DATA[toToken].logo }}
                style={s.tokenIconImage}
              />
              <Text style={s.tokenName}>{toToken}</Text>
            </TouchableOpacity>
            <Text style={[s.amountInput, { opacity: priceLoading ? 0.3 : 1 }]}>
              {estimatedReceive}
            </Text>
          </View>
          <View style={s.cardFooter}>
            <Text style={s.balanceText}>SLIPPAGE_TOLERANCE: {(slippageBps / 100).toFixed(2)}%</Text>
            <Text style={s.usdText}>EST_VALUE: ${displayUsdValue}</Text>
          </View>
        </View>

        {/* SLIPPAGE CONFIGURATION */}
        <View style={{ marginTop: 25, paddingHorizontal: 5 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ color: COLORS.muted, fontSize: 10, fontFamily: "monospace" }}>
              SLIPPAGE_CONFIG:
            </Text>
            <Text style={{ color: COLORS.green, fontSize: 10, fontFamily: "monospace", fontWeight: "800" }}>
              {(slippageBps / 100).toFixed(2)}%
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[10, 50, 100, 300].map((bps) => (
              <TouchableOpacity
                key={bps}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: slippageBps === bps ? COLORS.green : COLORS.line,
                  backgroundColor: slippageBps === bps ? "rgba(20, 241, 149, 0.1)" : "transparent",
                  alignItems: "center",
                }}
                onPress={() => setSlippageBps(bps)}
              >
                <Text
                  style={{
                    color: slippageBps === bps ? COLORS.green : COLORS.muted,
                    fontSize: 11,
                    fontFamily: "monospace",
                    fontWeight: slippageBps === bps ? "800" : "400",
                  }}
                >
                  {(bps / 100).toFixed(1)}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ACTION BUTTON */}
        <View style={[s.btnRow, { marginTop: 40 }]}>
          <TouchableOpacity
            style={[
              s.btn,
              loading && s.btnDisabled,
              !isConnected && {
                borderColor: COLORS.green,
                borderStyle: "dashed",
              },
            ]}
            onPress={handleAction}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text
                style={[s.btnText, !isConnected && { color: COLORS.green }]}
              >
                {isConnected ? "EXECUTE_SWAP" : "CONNECT_TO_SWAP"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {isConnected && (
          <TouchableOpacity
            onPress={wallet.disconnect}
            style={{ marginTop: 25, alignItems: "center" }}
          >
            <Text
              style={{
                color: COLORS.muted,
                fontSize: 10,
                fontFamily: "monospace",
              }}
            >
              [ TERMINATE_SESSION ]
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
