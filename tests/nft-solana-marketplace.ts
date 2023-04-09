import * as anchor from '@project-serum/anchor';
import { Program, Wallet } from '@project-serum/anchor';
import { NftSolanaMarketplace } from '../target/types/nft_solana_marketplace';
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, createInitializeMintInstruction, ASSOCIATED_TOKEN_PROGRAM_ID, ExtensionType, getMintLen, createInitializeNonTransferableMintInstruction, createAssociatedTokenAccount, transferChecked, burn, AccountLayout, TOKEN_PROGRAM_ID, MINT_SIZE,  } from '@solana/spl-token';
import { it } from 'mocha';
import { assert } from "chai";

describe('metaplex-anchor-nft', () => {
    const provider = anchor.AnchorProvider.env();
    const connection = provider.connection;
    const wallet = provider.wallet as Wallet;
    anchor.setProvider(provider);
    const program = anchor.workspace.NftSolanaMarketplace as Program<NftSolanaMarketplace>;
    const mintKey: anchor.web3.Keypair = anchor.web3.Keypair.generate();
    let ata: anchor.web3.PublicKey = undefined;
    const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
        "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    );

    // before(async () => {
    //     let res = await connection.requestAirdrop(wallet.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL);

    //     let latestBlockHash = await connection.getLatestBlockhash();

    //     await connection.confirmTransaction({
    //         blockhash: latestBlockHash.blockhash,
    //         lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    //         signature: res,
    //     });
    // });

    it("mints a token", async () => {
        // Get the amount of SOL needed to pay rent for our Token Mint
        const lamports: number = await program.provider.connection.getMinimumBalanceForRentExemption(
            MINT_SIZE
        );

        console.log("Mint key: ", mintKey.publicKey.toString());
        console.log("User (payer): ", wallet.publicKey.toString());

        // Fires a list of instructions
        const mint_tx = new anchor.web3.Transaction().add(
            // Use anchor to create an account from the mint key that we created
            anchor.web3.SystemProgram.createAccount({
                fromPubkey: wallet.publicKey,
                newAccountPubkey: mintKey.publicKey,
                lamports,
                space: MINT_SIZE,
                programId: TOKEN_PROGRAM_ID,
            }),
            // Fire a transaction to create our mint account that is controlled by our anchor wallet
            createInitializeMintInstruction(
                mintKey.publicKey,
                0,
                wallet.publicKey,
                wallet.publicKey,
                TOKEN_PROGRAM_ID
            ), 
        );

        const res = await anchor.AnchorProvider.env().sendAndConfirm(mint_tx, [mintKey]);
        console.log(
            await program.provider.connection.getParsedAccountInfo(mintKey.publicKey)
        );
        console.log("Mint tx: ", res);

        // creates the ATA to mint a token to
        ata = await createAssociatedTokenAccount(
            connection,
            wallet.payer,
            mintKey.publicKey,
            wallet.publicKey,
            { commitment: "confirmed" },
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );
        console.log("ATA: ", ata.toString());

        const metadataKey = anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mintKey.publicKey.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        )[0];
        console.log("Metadata Account: ", metadataKey.toString());

        const masterEditionKey = anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mintKey.publicKey.toBuffer(),
                Buffer.from("edition"),
            ],
            TOKEN_METADATA_PROGRAM_ID
        )[0];
        console.log("Master Edition Account: ", masterEditionKey.toString());



        // executes anchor code to mint the token into the ATA
        try {
            const tx = await program.methods.mintToken(
                mintKey.publicKey,
                "TEST",
                "TT",
                "SA",
            )
                .accounts({
                    authority: wallet.publicKey,
                    mint: mintKey.publicKey,
                    tokenAccount: ata,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
                    metadata: metadataKey,
                    masterEdition: masterEditionKey,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY
                })
                .signers([wallet.payer])
                .rpc();
            console.log("Your transaction signature", tx);
        } catch (error) {
            console.log("An error occured: ", error);
        }

        const accountInfo = await connection.getAccountInfo(ata);
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


    xit("cannot transfer token from ATA with non-transferable mint", async () => {
        // Wallet that will receive the token 
        const toWallet: anchor.web3.Keypair = anchor.web3.Keypair.generate();
        // The ATA for a token on the to wallet (but might not exist yet)
        const toATA = await createAssociatedTokenAccount(
            connection,
            wallet.payer,
            mintKey.publicKey,
            toWallet.publicKey,
            { commitment: "confirmed" },
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );
        console.log("Receiving ATA: ", toATA.toString());

        try {
            await transferChecked(
                connection,
                wallet.payer,
                ata,
                mintKey.publicKey,
                toATA,
                wallet.publicKey,
                1,
                0,
                [],
                { commitment: "confirmed" },
                TOKEN_PROGRAM_ID
            );

            // If the transfer was successful, fail the test
            assert.fail("Expected transfer to fail!");
        } catch (error) {
            // If the transfer failed as expected, check the error message
            assert.include(error.message, "custom program error: 0x25", "The mint is non-trasferable as expected.");
        }
    });

    xit("burns token", async () => {
        const tx = await burn(
            connection,
            wallet.payer,
            ata,
            mintKey.publicKey,
            wallet.publicKey,
            1,
            //0,
            [],
            { commitment: "confirmed" },
            TOKEN_PROGRAM_ID
        );
        console.log("Burn tx: ", tx);

        const accountInfo = await connection.getAccountInfo(ata);
        const data = accountInfo?.data;

        if (data) {
            // Parse the account state data
            const accountState = AccountLayout.decode(Buffer.from(data));

            // Get the delegatedAmount from the account state
            const amount = accountState.amount;

            console.log("Account state: ", accountState.state, "\nToken amount after burning: ", amount);
            assert.equal(amount, BigInt(0));
        }
    });
});
