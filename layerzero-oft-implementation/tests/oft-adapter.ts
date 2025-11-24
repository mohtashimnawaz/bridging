import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OftAdapter } from "../target/types/oft_adapter";
import { assert } from "chai";

describe("oft-adapter", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.OftAdapter as Program<OftAdapter>;

  it("Initializes the OFT Store", async () => {
    const store = anchor.web3.Keypair.generate();
    const admin = program.provider.publicKey;

    const tx = await program.methods
      .initialize(admin)
      .accounts({
        store: store.publicKey,
        payer: program.provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([store])
      .rpc();

    console.log("Initialize TX:", tx);

    const storeAccount = await program.account.store.fetch(store.publicKey);
    assert.equal(storeAccount.admin.toBase58(), admin.toBase58());
  });

  it("Locks tokens (stub)", async () => {
    // TODO: Implement test after lock_tokens instruction is fleshed out
    // For now, just verify the method exists
    assert.ok(program.methods.lockTokens);
  });
});
