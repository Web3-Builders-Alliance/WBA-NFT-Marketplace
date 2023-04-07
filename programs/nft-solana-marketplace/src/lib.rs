use anchor_lang::{
    prelude::*,
    solana_program::program::invoke,
    system_program::{System, ID as SYSTEM_PROGRAM_ID},
};
use anchor_spl::{
    associated_token::{AssociatedToken, ID as ATA_PROGRAM_ID},
    token_2022::{
        initialize_account3, initialize_mint2, mint_to, InitializeAccount3, InitializeMint2,
        MintTo, Token2022, ID as TOKEN_2022_ID,
    },
};
use mpl_token_metadata::{
    instruction::{
        create_master_edition_v3, create_metadata_accounts_v3, set_and_verify_collection
    },
    state::{Creator, MAX_MASTER_EDITION_LEN, MAX_METADATA_LEN},
    ID as TOKEN_METADATA_PROGRAM_ID
};

pub mod tk22_non_transf_mint;
use tk22_non_transf_mint::{
    initialize_non_transferable_mint, InitializeNonTransferableMint, TokenAccount, Mint
};

declare_id!("HLsC3GxE8t23SFaCGo5CgeRmUrDNzhu8rciBc6ysZr1B");

#[program]
pub mod nft_solana_marketplace {
    use super::*;

    pub fn mint_token(
        ctx: Context<MintToken>,
        creator_key: Pubkey,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        msg!("Minting a token...");
        // Create the MintTo struct for our context
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        // Create the CpiContext we need for the request
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        // Execute anchor's helper function to mint tokens
        let result = mint_to(cpi_ctx, 1);
        if let Err(_) = result {
            return Err(error!(CustomErrors::MintFailed));
        }

        msg!(
            "1 token has been minted to the {}",
            ctx.accounts.token_account.key()
        );

        // creating a metadata account
        msg!("Metadata account creating...");

        // accounts that are required for invoking the "create_metadata..."
        let accounts = vec![
            ctx.accounts.metadata.to_account_info(), // Metadata account
            ctx.accounts.mint.to_account_info(),    // mint
            ctx.accounts.authority.to_account_info(), // mint authority
            ctx.accounts.authority.to_account_info(),  // payer
            ctx.accounts.authority.to_account_info(),  // update authority
            ctx.accounts.system_program.to_account_info(), // system program
            ctx.accounts.rent.to_account_info(), // rent
        ];
        let creators = vec![
            Creator {
                address: creator_key,
                verified: false,
                share: 100,
            },
            Creator {
                address: ctx.accounts.authority.key(),
                verified: false,
                share: 0,
            },
        ];

        msg!("Metadata account owner: {}", ctx.accounts.metadata.to_account_info().owner);
        msg!("Mint account owner: {}", ctx.accounts.mint.to_account_info().owner);
        msg!("Authority account owner: {}", ctx.accounts.authority.to_account_info().owner);
        msg!("Payer account owner: {}", ctx.accounts.authority.to_account_info().owner);

        let result = invoke(
            &create_metadata_accounts_v3(
                ctx.accounts.token_metadata_program.key(),
                ctx.accounts.metadata.key(),
                ctx.accounts.mint.key(),
                ctx.accounts.authority.key(),
                ctx.accounts.authority.key(),
                ctx.accounts.authority.key(),
                name,
                symbol,
                uri,
                Some(creators),
                1,
                false,
                true,
                None,
                None,
                None
            ),
            &accounts,
        );
        if let Err(_) = result {
            return Err(error!(CustomErrors::MetadataCreateFailed));
        }
        msg!("Metadata account created!");

        Ok(())
    }

    // TODO: change_nft_metadata insctuction

    // TODO: print_nft insctuction (make a copy of the non-trasferrable nft to "list" it)

    // TODO: list_printed_nft insctuction (not sure about this one yet)
    // TODO: delist_printed_nft insctuction (not sure about this one yet)
}

#[derive(Accounts)]
pub struct MintToken<'info> {
    /// CHECK: the authority of the mint account
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: This is the token that we want to mint
    #[account(
        mut,
        owner = TOKEN_2022_ID,
        // mint::decimals = 0,
        // mint::authority = authority,
        // mint::freeze_authority = authority
    )]
    pub mint: UncheckedAccount<'info>,
    /// CHECK: This is the token account that we want to mint tokens to
    #[account(
        mut,
        // init,
        // payer = authority,
        // associated_token::mint = mint,
        // associated_token::authority = authority
    )]
    pub token_account: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
    //pub associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK: No need to check
    #[account(address = TOKEN_METADATA_PROGRAM_ID)]
    pub token_metadata_program: UncheckedAccount<'info>,
    /// CHECK: No need to check
    #[account(
        init,
        payer = authority,
        space = MAX_METADATA_LEN,
        seeds = [b"metadata", TOKEN_METADATA_PROGRAM_ID.as_ref(), mint.key().as_ref()],
        bump,
        owner = TOKEN_METADATA_PROGRAM_ID @ CustomErrors::WrongMetadataOwner
    )]
    pub metadata: UncheckedAccount<'info>,
    /// CHECK: No need to check
    #[account(
        init,
        payer = authority,
        space = MAX_MASTER_EDITION_LEN,
        seeds = [b"metadata", TOKEN_METADATA_PROGRAM_ID.as_ref(), mint.key().as_ref(), b"edition"],
        bump,
        owner = TOKEN_METADATA_PROGRAM_ID @ CustomErrors::WrongMasterEditionOwner
    )]
    pub master_edition: UncheckedAccount<'info>,
    pub rent: Sysvar<'info, Rent>,
}

#[error_code]
pub enum CustomErrors {
    #[msg("Mint failed!")]
    MintFailed,

    #[msg("Metadata account create failed!")]
    MetadataCreateFailed,

    #[msg("Metadata isn't owned by the metadata program")]
    WrongMetadataOwner,

    #[msg("Master Edition isn't owned by the metadata program")]
    WrongMasterEditionOwner,
}
