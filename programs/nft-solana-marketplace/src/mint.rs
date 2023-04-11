use anchor_lang::{
    prelude::*,
    solana_program::program::invoke,
    system_program::{create_account, CreateAccount, System},
};
use anchor_spl::{
    associated_token::{create, AssociatedToken, Create},
    token::{initialize_mint2, mint_to, InitializeMint2, Mint, MintTo, Token, TokenAccount},
};

use mpl_token_metadata::{
    instruction::{create_master_edition_v3, create_metadata_accounts_v3},
    //state::Creator,
    ID as TOKEN_METADATA_PROGRAM_ID,
};

pub fn create_and_initialize(ctx: Context<CreateMintAndATA>) -> Result<()> {
    msg!("Creating mint account...");
    msg!("Mint: {}", &ctx.accounts.mint.key());
    create_account(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            CreateAccount {
                from: ctx.accounts.authority.to_account_info(),
                to: ctx.accounts.mint.to_account_info(),
            }
        ),
        100_000_000, // lamports
        82, // Mint::LEN.try_into().unwrap()
        &ctx.accounts.token_program.key(),
    )?;

    msg!("Initializing mint account...");
    msg!("Mint: {}", &ctx.accounts.mint.key());
    initialize_mint2(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            InitializeMint2 {
                mint: ctx.accounts.mint.to_account_info(),
            },
        ),
        0,
        &ctx.accounts.authority.key(),
        Some(&ctx.accounts.authority.key()),
    )?;

    msg!("Creating token account...");
    msg!("Token Address: {}", &ctx.accounts.token_account.key());
    create(CpiContext::new(
        ctx.accounts.associated_token_program.to_account_info(),
        Create {
            payer: ctx.accounts.authority.to_account_info(),
            associated_token: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        },
    ))?;

    Ok(())
}

pub fn mint(ctx: Context<MintNFT>, name: String, symbol: String, uri: String) -> Result<()> {
    msg!("Minting a token...");
    msg!("Mint: {}", &ctx.accounts.mint.to_account_info().key());
    msg!("Token Address: {}", &ctx.accounts.token_account.key());
    mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        1,
    )?;

    // creating a metadata account
    msg!("Metadata account creating...");
    msg!(
        "Metadata account address: {}",
        &ctx.accounts.metadata.to_account_info().key()
    );
    invoke(
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
            None, // creators
            1,
            true,
            true,
            None,
            None,
            None,
        ),
        &[
            ctx.accounts.metadata.to_account_info(),  // Metadata account
            ctx.accounts.mint.to_account_info(),      // mint
            ctx.accounts.authority.to_account_info(), // mint authority, payer, update authority
            ctx.accounts.system_program.to_account_info(), // system program
            ctx.accounts.rent.to_account_info(),      // rent
        ],
    )?;
    msg!("Metadata account created!");

    msg!("Creating a master edition...");
    msg!(
        "Master edition metadata account address: {}",
        &ctx.accounts.master_edition.to_account_info().key()
    );
    invoke(
        &create_master_edition_v3(
            ctx.accounts.token_metadata_program.key(),
            ctx.accounts.master_edition.key(),
            ctx.accounts.mint.key(),
            ctx.accounts.authority.key(),
            ctx.accounts.authority.key(),
            ctx.accounts.metadata.key(),
            ctx.accounts.authority.key(),
            Some(1),
        ),
        &[
            ctx.accounts.master_edition.to_account_info(), // Edition account
            ctx.accounts.mint.to_account_info(),           // mint
            ctx.accounts.authority.to_account_info(), // update authority, mint authority, payer
            ctx.accounts.metadata.to_account_info(),  // Metadata account
            ctx.accounts.token_program.to_account_info(), // SPL token program
            ctx.accounts.system_program.to_account_info(), // system program
            ctx.accounts.rent.to_account_info(),      // rent
        ],
    )?;
    msg!("Master Edition has been created!");

    Ok(())
}

#[derive(Accounts)]
pub struct CreateMintAndATA<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: No need to check, it's just a pubkey 
    #[account(mut)]
    pub mint: Signer<'info>,
    /// CHECK: This is the token account that we want to mint tokens to
    #[account(mut)]
    pub token_account: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct MintNFT<'info> {
    /// CHECK: the authority of the mint account
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: This is the token that we want to mint
    #[account(mut)]
    pub mint: Signer<'info>,
    /// CHECK: This is the token account that we want to mint tokens to
    #[account(mut)]
    pub token_account: UncheckedAccount<'info>,
    /// CHECK: No need to check
    #[account(
        mut,
        seeds = [b"metadata", TOKEN_METADATA_PROGRAM_ID.as_ref(), mint.key().as_ref()],
        bump,
        seeds::program = token_metadata_program.key()
    )]
    pub metadata: UncheckedAccount<'info>,
    /// CHECK: No need to check
    #[account(
        mut,
        seeds = [b"metadata", TOKEN_METADATA_PROGRAM_ID.as_ref(), mint.key().as_ref(), b"edition"],
        bump,
        seeds::program = token_metadata_program.key()
    )]
    pub master_edition: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK: No need to check
    #[account(address = TOKEN_METADATA_PROGRAM_ID)]
    pub token_metadata_program: UncheckedAccount<'info>,
    pub rent: Sysvar<'info, Rent>,
}

