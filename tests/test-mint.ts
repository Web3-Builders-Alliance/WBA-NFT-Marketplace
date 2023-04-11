import * as anchor from "@project-serum/anchor";
// ** Comment this to use solpg imported IDL **
import { MintNft } from "../target/types/mint_nft";
import { AccountLayout, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";


describe("nft-marketplace", async () => {

    const testNftTitle = "Web3 Builders Aliance";
    const testNftSymbol = "W3BA";
    const testNftUri = "https://raw.githubusercontent.com/Coding-and-Crypto/Solana-NFT-Marketplace/master/assets/example.json";

    const provider = anchor.AnchorProvider.env()
    const wallet = provider.wallet as anchor.Wallet;
    anchor.setProvider(provider);

    // ** Un-comment this to use solpg imported IDL **
    // const program = new anchor.Program(
    //   require("../solpg/idl.json"), 
    //   new anchor.web3.PublicKey("H2UJjAQTuVJYhaBhh6GD2KaprLBTp1vhP2aaHioya5NM"),
    // );
    // ** Comment this to use solpg imported IDL **
    const program = anchor.workspace.MintNft as anchor.Program<MintNft>;

    const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
        "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    );


    it("Mint!", async () => {

        // Derive the mint address and the associated token account address

        const mintKeypair: anchor.web3.Keypair = anchor.web3.Keypair.generate();
        const tokenAddress = await anchor.utils.token.associatedAddress({
            mint: mintKeypair.publicKey,
            owner: wallet.publicKey
        });
        console.log(`New token: ${mintKeypair.publicKey}`);

        // Derive the metadata and master edition addresses

        const metadataAddress = anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mintKeypair.publicKey.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        )[0];
        console.log("Metadata initialized");

        const masterEditionAddress = anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mintKeypair.publicKey.toBuffer(),
                Buffer.from("edition"),
            ],
            TOKEN_METADATA_PROGRAM_ID
        )[0];
        console.log("Master edition metadata initialized");

        try {
            await program.methods.createAndInitialize()
                .accounts({
                    authority: wallet.publicKey,
                    mint: mintKeypair.publicKey,
                    tokenAccount: tokenAddress,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                })
                .signers([mintKeypair])
                .rpc();
        } catch (error) {
            console.log("AN ERROR OCCURED: ", error);
        }

        try {
            await program.methods.mint(
                testNftTitle, testNftSymbol, testNftUri
            )
                .accounts({
                    authority: wallet.publicKey,
                    mint: mintKeypair.publicKey,
                    tokenAccount: tokenAddress,
                    metadata: metadataAddress,
                    masterEdition: masterEditionAddress,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY
                })
                .signers([mintKeypair])
                .rpc();
        } catch (error) {
            console.log("AN ERROR OCCURED: ", error);
        }

        const accountInfo = await provider.connection.getAccountInfo(tokenAddress);
        const data = accountInfo?.data;

        if (data) {
            // Parse the account state data
            const accountState = AccountLayout.decode(Buffer.from(data));

            // Get the delegatedAmount from the account state
            const amount = accountState.amount;

            console.log("Token amount: ", amount);
            assert.equal(amount, BigInt(1));
        }
    });

    // xit("cannot transfer token from ATA with non-transferable mint", async () => {
    //     // Wallet that will receive the token 
    //     const toWallet: anchor.web3.Keypair = anchor.web3.Keypair.generate();
    //     // The ATA for a token on the to wallet (but might not exist yet)
    //     const toATA = await createAssociatedTokenAccount(
    //         provider.connection,
    //         wallet.payer,
    //         mintKey.publicKey,
    //         toWallet.publicKey,
    //         { commitment: "confirmed" },
    //         TOKEN_PROGRAM_ID,
    //         ASSOCIATED_TOKEN_PROGRAM_ID
    //     );
    //     console.log("Receiving ATA: ", toATA.toString());

    //     try {
    //         await transferChecked(
    //             connection,
    //             wallet.payer,
    //             ata,
    //             mintKey.publicKey,
    //             toATA,
    //             wallet.publicKey,
    //             1,
    //             0,
    //             [],
    //             { commitment: "confirmed" },
    //             TOKEN_PROGRAM_ID
    //         );

    //         // If the transfer was successful, fail the test
    //         assert.fail("Expected transfer to fail!");
    //     } catch (error) {
    //         // If the transfer failed as expected, check the error message
    //         assert.include(error.message, "custom program error: 0x25", "The mint is non-trasferable as expected.");
    //     }
    // });

});