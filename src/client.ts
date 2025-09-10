import {
  estimateComputeUnitLimitFactory,
  getSetComputeUnitLimitInstruction,
} from "@solana-program/compute-budget";
import {
  airdropFactory,
  appendTransactionMessageInstruction,
  BaseTransactionMessage,
  generateKeyPairSigner,
  KeyPairSigner,
  lamports,
  MessageSigner,
  Rpc,
  RpcSubscriptions,
  sendAndConfirmTransactionFactory,
  SolanaRpcApi,
  SolanaRpcSubscriptionsApi,
  TransactionMessageWithFeePayer,
  TransactionSigner,
} from "@solana/kit";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";

export type Client = {
  estimateAndSetComputeUnitLimit: ReturnType<
    typeof estimateAndSetComputeUnitLimitFactory
  >;
  rpc: Rpc<SolanaRpcApi>;
  rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
  wallet: TransactionSigner & MessageSigner;
  sendAndConfirmTransaction: ReturnType<
    typeof sendAndConfirmTransactionFactory
  >;
};

let client: Client | undefined;

function estimateAndSetComputeUnitLimitFactory(
  ...params: Parameters<typeof estimateComputeUnitLimitFactory>
) {
  const estimateComputeUnitLimit = estimateComputeUnitLimitFactory(...params);
  return async <
    T extends BaseTransactionMessage & TransactionMessageWithFeePayer
  >(
    transactionMessage: T
  ) => {
    const computeUnitsEstimate = await estimateComputeUnitLimit(
      transactionMessage
    );
    return appendTransactionMessageInstruction(
      getSetComputeUnitLimitInstruction({ units: computeUnitsEstimate }),
      transactionMessage
    );
  };
}

export async function createClient(): Promise<Client> {
  if (!client) {
    const wallet: KeyPairSigner = await generateKeyPairSigner();
    const rpc = createSolanaRpc("http://127.0.0.1:8899");
    const rpcSubscriptions = createSolanaRpcSubscriptions(
      "ws://127.0.0.1:8900"
    );

    //   airdrop
    const airdrop = airdropFactory({ rpc, rpcSubscriptions });
    await airdrop({
      recipientAddress: wallet.address,
      lamports: lamports(1_000_000_000n),
      commitment: "confirmed",
    });
    const estimateAndSetComputeUnitLimit =
      estimateAndSetComputeUnitLimitFactory({
        rpc,
      });
    const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
      rpc,
      rpcSubscriptions,
    });
    client = {
      estimateAndSetComputeUnitLimit,
      rpc: createSolanaRpc("http://127.0.0.1:8899"),
      rpcSubscriptions: createSolanaRpcSubscriptions("ws://127.0.0.1:8900"),
      wallet,
      sendAndConfirmTransaction,
    };
  }
  return client;
}
