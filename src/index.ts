import { address, generateKeyPair } from "@solana/kit";
import { createClient } from "./client";
import { createMint } from "./create-mint";

tutorial();

async function tutorial() {
  // find balance
  const client = await createClient();
  const accountAddress = address(client.wallet.address);
  const { value: balance } = await client.rpc.getBalance(accountAddress).send();
  console.log(`Balance: ${balance} lamports.`);

  // Create Mint
  const mintAddress = await createMint(client, { decimals: 2 });
  console.log("Mint created: ", mintAddress);

  //   create wallets
  const wallet: CryptoKeyPair = await generateKeyPair();
}
