use anchor_lang::{
    prelude::*,
    solana_program::program::{invoke, invoke_signed},
    system_program::{create_account, CreateAccount, System},
};
use anchor_spl::{
    associated_token::{create, AssociatedToken, Create},
    token::{initialize_mint2, mint_to, InitializeMint2, Mint, MintTo, Token, TokenAccount },
    
};

use mpl_token_metadata::{
    instruction::{mint_new_edition_from_master_edition_via_token},
    //state::Creator,
    ID as TOKEN_METADATA_PROGRAM_ID,
};

pub fn print(ctx: Context<Print>, edition: u64) -> Result<()> {
    // create new mint account, TA and mint token to the new TA

    //thaw original TA account
    msg!("New metadata: {}", &ctx.accounts.new_metadata.key());
    msg!("New edition: {}", &ctx.accounts.new_edition.key());
    msg!("Master edition: {}", &ctx.accounts.master_edition.key());
    msg!("New mint: {}", &ctx.accounts.new_mint.key());
    msg!("Edition Mark PDA: {}", &ctx.accounts.edition_mark_pda.key());
    msg!("Token Account: {}", &ctx.accounts.token_account.key());
    msg!("Metadata: {}", &ctx.accounts.metadata.key());

    msg!("Creating a new edition (printing)...");
    invoke(
        &mint_new_edition_from_master_edition_via_token(
            ctx.accounts.token_metadata_program.key(),
            ctx.accounts.new_metadata.key(),
            ctx.accounts.new_edition.key(),
            ctx.accounts.master_edition.key(),
            ctx.accounts.new_mint.key(),
            ctx.accounts.master_edition_owner_authority.key(),
            ctx.accounts.master_edition_owner_authority.key(),
            ctx.accounts.master_edition_owner_authority.key(),
            ctx.accounts.token_account.key(),
            ctx.accounts.master_edition_owner_authority.key(),
            ctx.accounts.metadata.key(),
            ctx.accounts.mint.key(), // original mint or the new mint, check both
            edition,   // TODO: not sure if it has to be hardcoded, find out
        ),
        &[
            ctx.accounts.token_metadata_program.to_account_info(),
            ctx.accounts.new_metadata.to_account_info(),
            ctx.accounts.new_edition.to_account_info(),
            ctx.accounts.master_edition.to_account_info(),
            ctx.accounts.new_mint.to_account_info(),
            ctx.accounts.edition_mark_pda.to_account_info(),
            ctx.accounts.master_edition_owner_authority.to_account_info(),
            ctx.accounts.master_edition_owner_authority.to_account_info(),
            ctx.accounts.master_edition_owner_authority.to_account_info(),
            ctx.accounts.token_account.to_account_info(),
            ctx.accounts.master_edition_owner_authority.to_account_info(),
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;
    msg!("New Edition has been created: {}", &ctx.accounts.new_edition.key());
    msg!("New printed NFT mint: {}", &ctx.accounts.new_mint.key());

    // freeze original nft TA

    Ok(())
}

#[derive(Accounts)]
pub struct Print<'info> {
    /// CHECK: No need to check
    #[account(
        mut,
        seeds = [b"metadata", TOKEN_METADATA_PROGRAM_ID.as_ref(), new_mint.key().as_ref()],
        bump,
        seeds::program = token_metadata_program.key()
    )]
    pub new_metadata: UncheckedAccount<'info>,
    /// CHECK: No need to check
    #[account(
        mut,
        seeds = [b"metadata", TOKEN_METADATA_PROGRAM_ID.as_ref(), new_mint.key().as_ref(), b"edition"],
        bump,
        seeds::program = token_metadata_program.key()
    )]
    pub new_edition: UncheckedAccount<'info>,
    /// CHECK: No need to check
    #[account(
        mut,
        seeds = [b"metadata", TOKEN_METADATA_PROGRAM_ID.as_ref(), mint.key().as_ref(), b"edition"],
        bump,
        seeds::program = token_metadata_program.key()
    )]
    pub master_edition: UncheckedAccount<'info>,
    /// CHECK: This is the token that we want to mint
    #[account(mut)]
    pub new_mint: UncheckedAccount<'info>,

    /// CHECK: No need to check
    #[account(
        mut,
        seeds = [b"metadata", TOKEN_METADATA_PROGRAM_ID.as_ref(), mint.key().as_ref(), b"edition", &[1].as_ref()],
        bump,
        seeds::program = token_metadata_program.key()
    )]
    pub edition_mark_pda: UncheckedAccount<'info>,

    /// CHECK: the authority of the mint account
    #[account(mut)]
    pub master_edition_owner_authority: Signer<'info>,
    /// CHECK: This is the token that we want to mint
    #[account(mut)]
    pub mint: UncheckedAccount<'info>,
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
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    //pub associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK: No need to check
    #[account(address = TOKEN_METADATA_PROGRAM_ID)]
    pub token_metadata_program: UncheckedAccount<'info>,
    pub rent: Sysvar<'info, Rent>,
}