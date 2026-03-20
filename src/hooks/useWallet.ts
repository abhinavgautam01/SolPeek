import { useState, useCallback, useMemo } from "react";
import {
  transact,
  Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";

import {
  Connection,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import { useWalletStore } from "../store/wallet-store";

const APP_IDENTITY = {
  name: "SolPeek",
  uri: "https://solpeek.com",
  icon: "favicon.ico",
};

export function useWallet() {
  const [connecting, setConnecting] = useState(false);
  const [sending, setSending] = useState(false);

  const publicKey = useWalletStore((s) => s.publicKey);
  const setPublicKey = useWalletStore((s) => s.setPublicKey);
  const authToken = useWalletStore((s) => s.authToken);
  const setAuthToken = useWalletStore((s) => s.setAuthToken);
  const isDevnet = useWalletStore((s) => s.isDevnet);

  const cluster = isDevnet ? "devnet" : "mainnet-beta";

  const connection = useMemo(
    () => new Connection(clusterApiUrl(cluster), "confirmed"),
    [cluster],
  );

  /*
  CONNECT WALLET
  */
  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      await transact(async (wallet: Web3MobileWallet) => {
        const authResult = await wallet.authorize({
          chain: `solana:${cluster}`,
          identity: APP_IDENTITY,
        });

        const pubkey = new PublicKey(
          Buffer.from(authResult.accounts[0].address, "base64"),
        );

        setPublicKey(pubkey.toBase58());
        setAuthToken(authResult.auth_token);
      });
    } finally {
      setConnecting(false);
    }
  }, [cluster, setPublicKey, setAuthToken]);

  /*
  DISCONNECT
  */
  const disconnect = useCallback(() => {
    setPublicKey(null);
    setAuthToken(null);
  }, [setPublicKey, setAuthToken]);

  /*
  SEND SOL — authorize + build + sign all in ONE transact() session
  */
  const sendSOL = useCallback(
    async (toAddress: string, amountSOL: number) => {
      if (!publicKey) throw new Error("Wallet not connected");

      setSending(true);
      try {
        console.log("=== SEND START ===");
        console.log("publicKey:", publicKey);
        console.log("authToken:", authToken);
        console.log("toAddress:", toAddress);
        console.log("amountSOL:", amountSOL);
        console.log("cluster:", cluster);

        // Fetch blockhash BEFORE opening the wallet session so the session
        // isn't held open during a network call (causes Phantom to drop/timeout).
        console.log("Fetching blockhash...");
        const { blockhash } = await connection.getLatestBlockhash();
        console.log("Got blockhash:", blockhash);

        const signedTx = await transact(async (wallet: Web3MobileWallet) => {
          console.log("=== INSIDE TRANSACT ===");

          // Step 1: reauthorize or authorize
          let authResult;
          try {
            if (authToken) {
              console.log("Attempting reauthorize...");
              authResult = await wallet.reauthorize({
                auth_token: authToken,
                identity: APP_IDENTITY,
              });
              console.log("Reauthorize SUCCESS:", authResult);
            } else {
              console.log("Attempting authorize...");
              authResult = await wallet.authorize({
                chain: `solana:${cluster}`,
                identity: APP_IDENTITY,
              });
              console.log("Authorize SUCCESS:", authResult);
            }
          } catch (authErr) {
            console.log("AUTH ERROR:", authErr);
            throw authErr;
          }

          setAuthToken(authResult.auth_token);

          // Step 2: build tx using the pre-fetched blockhash
          console.log("Building transaction...");
          const from = new PublicKey(publicKey);
          const to = new PublicKey(toAddress);

          const message = new TransactionMessage({
            payerKey: from,
            recentBlockhash: blockhash,
            instructions: [
              SystemProgram.transfer({
                fromPubkey: from,
                toPubkey: to,
                lamports: Math.round(amountSOL * LAMPORTS_PER_SOL),
              }),
            ],
          }).compileToV0Message();

          const tx = new VersionedTransaction(message);
          console.log("Transaction built, attempting signTransactions...");

          // Step 3: sign only — popup appears reliably with signTransactions.
          // signAndSendTransactions can silently skip the popup when auth also
          // happened in the same session.
          try {
            const [signedTx] = await wallet.signTransactions({
              transactions: [tx],
            });
            console.log("signTransactions SUCCESS");
            return signedTx;
          } catch (signErr) {
            console.log("SIGN ERROR:", signErr);
            throw signErr;
          }
        });

        // Step 4: broadcast outside transact so we control the RPC endpoint
        console.log("Broadcasting transaction...");
        const sig = await connection.sendRawTransaction(
          (signedTx as VersionedTransaction).serialize(),
          { skipPreflight: false, preflightCommitment: "confirmed" },
        );
        console.log("=== FINAL SIGNATURE ===", sig);
        return sig;
      } catch (e) {
        console.log("=== OUTER ERROR ===", e);
        throw e;
      } finally {
        setSending(false);
      }
    },
    [publicKey, authToken, connection, cluster, setAuthToken],
  );

  return {
    publicKey,
    connected: !!publicKey,
    connecting,
    sending,
    connect,
    disconnect,
    sendSOL,
    connection,
  };
}
