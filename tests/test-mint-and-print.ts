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

    let mintKeypair: anchor.web3.Keypair = undefined;
    let masterTokenAccount: anchor.web3.PublicKey = undefined;

    it("mints an NFT", async () => {

        // Derive a mint address and an associated token account address

        mintKeypair = anchor.web3.Keypair.generate();
        masterTokenAccount = await anchor.utils.token.associatedAddress({
            mint: mintKeypair.publicKey,
            owner: wallet.publicKey
        });
        console.log(`Master mint: ${mintKeypair.publicKey}`);

        const metadataAddress = anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mintKeypair.publicKey.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        )[0];
        console.log("Metadata address:", metadataAddress.toBase58());
    
        const masterEditionAddress = anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mintKeypair.publicKey.toBuffer(),
                Buffer.from("edition"),
            ],
            TOKEN_METADATA_PROGRAM_ID
        )[0];
        console.log("Master edition address:", masterEditionAddress.toBase58());

        try {
            await program.methods.createInitializeAndMint()
                .accounts({
                    authority: wallet.publicKey,
                    mint: mintKeypair.publicKey,
                    tokenAccount: masterTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                })
                .signers([mintKeypair])
                .rpc();
        } catch (error) {
            console.log("AN ERROR OCCURED while creating and minting: ", error);
        }

        try {
            await program.methods.mintNft(
                testNftTitle, testNftSymbol, testNftUri
            )
                .accounts({
                    authority: wallet.publicKey,
                    mint: mintKeypair.publicKey,
                    tokenAccount: masterTokenAccount,
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
            console.log("AN ERROR OCCURED while minting an NFT: ", error);
        }

        console.log("MASTER NFT HAS BEEN MINTED");

        const accountInfo = await provider.connection.getAccountInfo(masterTokenAccount);
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

    it("prints a copy of the NFT", async () => {

        // Derive a mint address and an associated token account address

        const newMintKeypair: anchor.web3.Keypair = anchor.web3.Keypair.generate();
        const newTokenAddress = await anchor.utils.token.associatedAddress({
            mint: newMintKeypair.publicKey,
            owner: wallet.publicKey
        });
        console.log(`New mint address: ${newMintKeypair.publicKey}`);
        console.log(`New token address: ${newTokenAddress}`);

        const metadataAddress = anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mintKeypair.publicKey.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        )[0];
    
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

        const newMetadataAddress = anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                newMintKeypair.publicKey.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        )[0];
        console.log(`New metadata: ${newMetadataAddress.toBase58()}}`);

        const newEditionAddress = anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                newMintKeypair.publicKey.toBuffer(),
                Buffer.from("edition"),
            ],
            TOKEN_METADATA_PROGRAM_ID
        )[0];
        console.log(`New Edition: ${newEditionAddress.toBase58()}`);

        const editionMarkPda = anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mintKeypair.publicKey.toBuffer(),
                Buffer.from("edition"),
                new Uint8Array([1]),
            ],
            TOKEN_METADATA_PROGRAM_ID
        )[0];
        console.log(`Edition Mark Pda: ${editionMarkPda.toBase58()}`);

        try {
            await program.methods.createInitializeAndMint()
                .accounts({
                    authority: wallet.publicKey,
                    mint: newMintKeypair.publicKey,
                    tokenAccount: newTokenAddress,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                })
                .signers([newMintKeypair])
                .rpc();
        } catch (error) {
            console.log("AN ERROR OCCURED while creating a mint: ", error);
        }
        console.log(`New Mint created and initialized: ${newMintKeypair.publicKey.toBase58()}`);

        let edition = new anchor.BN(1);

        try {
            await program.methods.print(
                edition
            )
                .accounts({
                    newMetadata: newMetadataAddress,
                    newEdition: newEditionAddress,
                    masterEdition: masterEditionAddress,
                    newMint: newMintKeypair.publicKey,
                    editionMarkPda: editionMarkPda,
                    masterEditionOwnerAuthority: wallet.publicKey,
                    mint: mintKeypair.publicKey,
                    tokenAccount: masterTokenAccount,
                    metadata: metadataAddress,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    //associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY
                })
                .rpc();
        } catch (error) {
            console.log("AN ERROR OCCURED while printing: ", error);
        }

        const accountInfo = await provider.connection.getAccountInfo(newTokenAddress);
        const data = accountInfo?.data;

        if (data) {
            // Parse the account state data
            const accountState = AccountLayout.decode(Buffer.from(data));

            // Get the delegatedAmount from the account state
            const amount = accountState.amount;

            console.log("Token amount on a new TA: ", amount);
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