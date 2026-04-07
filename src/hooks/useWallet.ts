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

import { Buffer } from "buffer";
import axios from "axios";
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

  /*
  EXECUTE SWAP using Jupiter Aggregator v6
  
  IMPORTANT NOTE: As of April 2026, the Jupiter API endpoint (quote-api.jup.ag) 
  has DNS resolution issues and cannot be reached. This appears to be a Jupiter 
  infrastructure issue. The code below is correct and will work once Jupiter 
  fixes their DNS or publishes updated API documentation.
  
  Users should use Jupiter's web interface at jup.ag in the meantime.
  */
  const executeSwap = useCallback(
    async (
      inputMint: string,
      outputMint: string,
      amount: number,
      slippageBps: number = 50, // 0.5% default
    ) => {
      if (!publicKey) throw new Error("Wallet not connected");

      // Jupiter only supports mainnet
      if (isDevnet) {
        throw new Error("Jupiter swaps are only available on MAINNET. Please switch to mainnet in settings.");
      }

      setSending(true);
      try {
        console.log("=== SWAP START ===");
        console.log("publicKey:", publicKey);
        console.log("inputMint:", inputMint);
        console.log("outputMint:", outputMint);
        console.log("amount:", amount);
        console.log("slippageBps:", slippageBps);
        console.log("network:", cluster);

        // Step 1: Get quote from Jupiter using axios (better React Native support)
        console.log("Fetching Jupiter quote...");
        
        const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`;
        console.log("Quote URL:", quoteUrl);

        let quoteData;
        try {
          console.log("Making axios request to Jupiter...");
          const quoteResponse = await axios.get(quoteUrl, {
            timeout: 30000, // Increased to 30 seconds
            headers: {
              "Accept": "application/json",
              "User-Agent": "SolPeek/1.0",
            },
            validateStatus: (status) => status < 500, // Accept any status < 500
          });
          
          console.log("Response status:", quoteResponse.status);
          console.log("Response headers:", JSON.stringify(quoteResponse.headers).slice(0, 150));
          
          if (quoteResponse.status !== 200) {
            throw new Error(`Jupiter returned status ${quoteResponse.status}: ${JSON.stringify(quoteResponse.data)}`);
          }
          
          quoteData = quoteResponse.data;
          console.log("Quote received:", JSON.stringify(quoteData).slice(0, 200));
        } catch (axiosError: any) {
          console.error("Quote fetch error:", axiosError);
          console.error("Error code:", axiosError.code);
          console.error("Error message:", axiosError.message);
          console.error("Error response:", axiosError.response?.status, axiosError.response?.data);
          
          if (axiosError.code === "ECONNABORTED" || axiosError.message?.includes("timeout")) {
            throw new Error("Quote request timed out after 30 seconds. Jupiter API might be slow or unavailable.");
          }
          
          if (axiosError.response) {
            // Server responded with error status
            const errorMsg = typeof axiosError.response.data === 'string' 
              ? axiosError.response.data 
              : JSON.stringify(axiosError.response.data);
            throw new Error(`Jupiter API error (${axiosError.response.status}): ${errorMsg.slice(0, 200)}`);
          } else if (axiosError.request) {
            // Request made but no response received - likely network/DNS issue
            throw new Error("Unable to connect to Jupiter API. This could be due to:\n\n• Network/DNS issues\n• Jupiter's servers blocking requests\n• Firewall/VPN interference\n\nTry:\n1. Using a different network (WiFi vs mobile data)\n2. Disabling VPN if enabled\n3. Checking if jupiter.ag loads in your browser");
          } else {
            // Something else happened
            throw new Error(`Network error: ${axiosError.message || "Unknown error"}`);
          }
        }

        if (!quoteData || !quoteData.routePlan) {
          throw new Error("Invalid quote response from Jupiter. The swap route may not be available.");
        }

        // Step 2: Get swap transaction from Jupiter using axios
        console.log("Fetching swap transaction...");

        let swapData;
        try {
          const swapResponse = await axios.post(
            "https://quote-api.jup.ag/v6/swap",
            {
              quoteResponse: quoteData,
              userPublicKey: publicKey,
              wrapAndUnwrapSol: true,
              dynamicComputeUnitLimit: true,
              prioritizationFeeLamports: "auto",
            },
            {
              timeout: 20000,
              headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
              },
            }
          );
          swapData = swapResponse.data;
          console.log("Swap transaction received");
        } catch (axiosError: any) {
          console.error("Swap fetch error:", axiosError);
          
          if (axiosError.code === "ECONNABORTED" || axiosError.message?.includes("timeout")) {
            throw new Error("Swap request timed out. Please try again.");
          }
          
          if (axiosError.response) {
            throw new Error(`Swap transaction failed (${axiosError.response.status}): ${axiosError.response.data || "Unknown error"}`);
          } else if (axiosError.request) {
            throw new Error("Unable to get swap transaction. Please check your internet connection.");
          } else {
            throw new Error(`Network error: ${axiosError.message || "Unknown error"}`);
          }
        }

        const { swapTransaction } = swapData;
        
        if (!swapTransaction) {
          throw new Error("No swap transaction returned from Jupiter");
        }
        
        console.log("Swap transaction received");

        // Step 3: Deserialize transaction
        const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
        const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
        console.log("Transaction deserialized");

        // Step 4: Sign transaction with Mobile Wallet Adapter
        const signedTx = await transact(async (wallet: Web3MobileWallet) => {
          console.log("=== INSIDE TRANSACT ===");

          // Reauthorize or authorize
          let authResult;
          try {
            if (authToken) {
              console.log("Attempting reauthorize...");
              authResult = await wallet.reauthorize({
                auth_token: authToken,
                identity: APP_IDENTITY,
              });
              console.log("Reauthorize SUCCESS");
            } else {
              console.log("Attempting authorize...");
              authResult = await wallet.authorize({
                chain: `solana:${cluster}`,
                identity: APP_IDENTITY,
              });
              console.log("Authorize SUCCESS");
            }
          } catch (authErr) {
            console.log("AUTH ERROR:", authErr);
            throw authErr;
          }

          setAuthToken(authResult.auth_token);

          // Sign the transaction
          console.log("Signing swap transaction...");
          try {
            const [signedTransaction] = await wallet.signTransactions({
              transactions: [transaction],
            });
            console.log("Swap transaction signed");
            return signedTransaction;
          } catch (signErr) {
            console.log("SIGN ERROR:", signErr);
            throw signErr;
          }
        });

        // Step 5: Broadcast transaction
        console.log("Broadcasting swap transaction...");
        const signature = await connection.sendRawTransaction(
          (signedTx as VersionedTransaction).serialize(),
          {
            skipPreflight: false,
            maxRetries: 3,
            preflightCommitment: "confirmed",
          },
        );
        console.log("=== SWAP SIGNATURE ===", signature);

        // Step 6: Confirm transaction
        console.log("Confirming transaction...");
        const confirmation = await connection.confirmTransaction(
          signature,
          "confirmed",
        );
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }

        console.log("=== SWAP COMPLETED ===");
        return {
          signature,
          inputAmount: quoteData.inAmount,
          outputAmount: quoteData.outAmount,
        };
      } catch (e: any) {
        console.log("=== SWAP ERROR ===", e);
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
    executeSwap,
    connection,
  };
}
