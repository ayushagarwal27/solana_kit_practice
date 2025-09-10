import { getCreateAccountInstruction } from "@solana-program/system";
import { Client } from "./client";
import {
  appendTransactionMessageInstruction,
  appendTransactionMessageInstructions,
  assertIsSendableTransaction,
  createTransactionMessage,
  generateKeyPairSigner,
  getBase64EncodedWireTransaction,
  getSignatureFromTransaction,
  pipe,
  sendAndConfirmTransactionFactory,
  sendTransactionWithoutConfirmingFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";
import {
  getInitializeMintInstruction,
  getMintSize,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import {
  estimateComputeUnitLimitFactory,
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from "@solana-program/compute-budget";

export async function createMint(
  client: Client,
  options: { decimals?: number } = {}
) {
  const mintSize = getMintSize();
  const [mint, mintRent] = await Promise.all([
    generateKeyPairSigner(),
    client.rpc.getMinimumBalanceForRentExemption(BigInt(mintSize)).send(),
  ]);
  const createAccountIx = getCreateAccountInstruction({
    payer: client.wallet,
    newAccount: mint,
    space: mintSize,
    lamports: mintRent,
    programAddress: TOKEN_PROGRAM_ADDRESS,
  });

  const initializeMintIx = getInitializeMintInstruction({
    mint: mint.address,
    decimals: options.decimals ?? 0,
    mintAuthority: client.wallet.address,
    freezeAuthority: client.wallet.address,
  });

  const setComputeLimitIx = getSetComputeUnitLimitInstruction({
    units: 50_000,
  });
  const setComputePriceIx = getSetComputeUnitPriceInstruction({
    microLamports: 10_000,
  });

  const { value: latestBlockhash } = await client.rpc
    .getLatestBlockhash()
    .send();

  // Create TX
  const txMessage = await pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(client.wallet, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) =>
      appendTransactionMessageInstructions(
        [createAccountIx, initializeMintIx],
        tx
      ),
    (tx) => client.estimateAndSetComputeUnitLimit(tx)
  );

  const tx = await signTransactionMessageWithSigners(txMessage);
  assertIsSendableTransaction(tx);

  // const encodedTransaction = getBase64EncodedWireTransaction(tx);
  // await client.rpc
  //   .sendTransaction(encodedTransaction, {
  //     preflightCommitment: "confirmed",
  //     encoding: "base64",
  //   })
  //   .send();

  // const signature = getSignatureFromTransaction(tx);

  await client.sendAndConfirmTransaction(tx, { commitment: "confirmed" });
  return mint.address;
}
