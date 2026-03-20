import React, { useState } from "react";
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
import { s, COLORS } from "../../src/styles/styles";
import { ConnectButton } from "../../src/components/ConnectButton";
import { useWallet } from "../../src/hooks/useWallet";
import { ConnectedWalletCard } from "../../src/components/ConnectedWalletCard";

export default function SendTokens() {
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);

  // Form State
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("SOL");

  // Use the hook's state directly
  const isConnected = wallet.connected;

  const handleSend = async () => {
    if (!isConnected) {
      setLoading(true);
      try {
        await wallet.connect();
      } catch (e: any) {
        Alert.alert("CONNECTION_FAILED", e.message || "Wallet connection cancelled");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!recipient || !amount) {
      return Alert.alert("REQUIRED", "Please fill in all fields.");
    }

    setLoading(true);
    try {
      await wallet.sendSOL(recipient, parseFloat(amount));
      Alert.alert("SUCCESS", "Transaction Broadcasted!");
      setAmount("");
      setRecipient("");
    } catch (e: any) {
      Alert.alert("FAILED", e.message || "Transaction Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {/* IMPROVED HEADER SECTION */}
        <View style={{ marginBottom: 30 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            {/* Left Side: Brand */}
            <View style={{ flexDirection: "row" }}>
              <Text style={s.appname_first}>TOKEN</Text>
              <Text style={s.appname_second}>_DISPATCH</Text>
            </View>

            {/* Right Side: Themed Connect Button */}
            <ConnectButton
              connected={wallet.connected}
              connecting={wallet.connecting}
              publicKey={wallet.publicKey}
              onConnect={wallet.connect}
              onDisconnect={wallet.disconnect}
            />
          </View>

          {/* Subtitle moved below to act as a separator */}
          <View
            style={{
              height: 1,
              backgroundColor: COLORS.line,
              width: "40%",
              marginBottom: 8,
            }}
          />
          <Text style={s.subtitle}>Secure P2P Asset Transfer</Text>
        </View>

        {/* RECIPIENT INPUT */}
        <View style={[s.swapcard, { marginBottom: 20 }]}>
          <Text style={s.label}>RECIPIENT_ADDRESS</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              style={[
                s.input,
                {
                  flex: 1,
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.line,
                },
              ]}
              placeholder="Enter Solana address..."
              placeholderTextColor={COLORS.muted}
              value={recipient}
              onChangeText={setRecipient}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={{ marginLeft: 10 }}>
              <Ionicons
                name="qr-code-outline"
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* AMOUNT CARD */}
        <View style={s.swapcard}>
          <Text style={s.label}>AMOUNT_TO_SEND</Text>
          <View style={s.cardHeader}>
            <TouchableOpacity style={s.tokenSelector}>
              <Image
                source={{
                  uri: "https://api.phantom.app/image-proxy/?image=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2Fsolana-labs%2Ftoken-list%40main%2Fassets%2Fmainnet%2FSo11111111111111111111111111111111111111112%2Flogo.png",
                }}
                style={s.tokenIconImage}
              />
              <Text style={s.tokenName}>{token}</Text>
            </TouchableOpacity>
            <TextInput
              style={s.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={COLORS.line}
            />
          </View>
          <View style={s.cardFooter}>
            <Text style={s.balanceText}>
              STATUS: {isConnected ? "CONNECTED" : "READ_ONLY"}
            </Text>
            {isConnected && (
              <TouchableOpacity onPress={() => setAmount("0.0")}>
                <Text
                  style={{
                    color: COLORS.green,
                    fontSize: 10,
                    fontWeight: "800",
                  }}
                >
                  [ MAX ]
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* TRANSACTION PREVIEW */}
        {amount !== "" && recipient !== "" && (
          <View
            style={{
              marginTop: 30,
              padding: 20,
              borderWidth: 1,
              borderColor: COLORS.line,
              borderStyle: "dashed",
            }}
          >
            <Text
              style={{ color: COLORS.muted, fontSize: 9, marginBottom: 10 }}
            >
              TX_MANIFEST:
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 5,
              }}
            >
              <Text
                style={{
                  color: COLORS.primary,
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
              >
                NETWORK_FEE
              </Text>
              <Text
                style={{
                  color: COLORS.green,
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
              >
                0.000005 SOL
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text
                style={{
                  color: COLORS.primary,
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
              >
                TOTAL_DEBIT
              </Text>
              <Text
                style={{
                  color: COLORS.primary,
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
              >
                {amount} SOL
              </Text>
            </View>
          </View>
        )}

        {/* EXECUTION BUTTON */}
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
            onPress={handleSend}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text
                style={[s.btnText, !isConnected && { color: COLORS.green }]}
              >
                {isConnected ? "INITIATE_TRANSFER" : "CONNECT_TO_SEND"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 30, alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Ionicons
              name="shield-checkmark-outline"
              size={12}
              color={COLORS.muted}
            />
            <Text
              style={{
                color: COLORS.muted,
                fontSize: 9,
                fontFamily: "monospace",
              }}
            >
              END_TO_END_ENCRYPTED_BROADCAST
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
