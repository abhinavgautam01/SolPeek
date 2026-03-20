import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../styles/styles";
import { ConfirmModal } from "./ConfirmModal";
import { useState } from "react";

interface Props {
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectButton({ connected, connecting, publicKey, onConnect, onDisconnect }: Props) {
  const [modalVisible, setModalVisible] = useState(false);

  const handlePress = () => {
    if (connected) {
      setModalVisible(true); // Open custom modal
    } else {
      onConnect();
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={[styles.button, connected ? styles.connectedBorder : styles.baseBorder]} 
        onPress={handlePress}
      >
        <View style={[styles.statusDot, { backgroundColor: connected ? COLORS.green : COLORS.line }]} />
        <Text style={[styles.buttonText, connected && { color: COLORS.green }]}>
          {connected && publicKey ? `${publicKey.slice(0, 4)}..${publicKey.slice(-4)}` : "CONNECT"}
        </Text>
      </TouchableOpacity>

      <ConfirmModal
        visible={modalVisible}
        title="Disconnect_Wallet"
        message="Do you want to disconnect your current wallet..!?"
        onCancel={() => setModalVisible(false)}
        onConfirm={() => {
          setModalVisible(false);
          onDisconnect();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    gap: 8,
  },
  baseBorder: {
    borderColor: COLORS.line,
  },
  connectedBorder: {
    borderColor: COLORS.green,
    backgroundColor: 'rgba(20, 241, 149, 0.05)',
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  buttonText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
});