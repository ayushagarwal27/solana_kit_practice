import { address, generateKeyPair, unwrapOption } from "@solana/kit";
import { createClient } from "./client";
import { createMint } from "./create-mint";
import { fetchMint } from "@solana-program/token";

tutorial();

async function tutorial() {
  // find balance
  const client = await createClient();
  const accountAddress = address(client.wallet.address);
  const { value: balance } = await client.rpc.getBalance(accountAddress).send();
  console.log(`Balance: ${balance} lamports.`);

  // Create Mint
  const mintAddress = await createMint(client, { decimals: 2 });
  const mintAccount = await fetchMint(client.rpc, mintAddress);
  console.log("Mint created: ", mintAddress);
  console.log(`Mint lamports: ${mintAccount.lamports}.`);
  console.log(
    `Mint authority: ${unwrapOption(mintAccount.data.mintAuthority)}.`
  );
  console.log(`Mint decimals: ${mintAccount.data.decimals}.`);
  console.log(`Mint supply: ${mintAccount.data.supply}.`);

  //   create wallets
  const wallet: CryptoKeyPair = await generateKeyPair();
}
