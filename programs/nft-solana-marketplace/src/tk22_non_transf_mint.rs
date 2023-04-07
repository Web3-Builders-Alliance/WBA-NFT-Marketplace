use anchor_lang::{context::CpiContext, solana_program, Accounts, Result};
use anchor_lang::{
    prelude::*,
    solana_program::{account_info::AccountInfo, program_pack::Pack},
};
use std::ops::Deref;

pub use spl_token_2022::{self, ID};

pub fn initialize_non_transferable_mint<'info>(
    ctx: CpiContext<'_, '_, '_, 'info, InitializeNonTransferableMint<'info>>,
) -> Result<()> {
    let ix = spl_token_2022::instruction::initialize_non_transferable_mint(
        ctx.program.key,
        ctx.accounts.mint.key,
    )?;
    solana_program::program::invoke(&ix, &[ctx.accounts.mint.clone()]).map_err(Into::into)
}

#[derive(Accounts)]
pub struct InitializeNonTransferableMint<'info> {
    ///CHECK: NOOO
    pub mint: AccountInfo<'info>,
}

#[derive(Clone, Debug, Default, PartialEq)]
pub struct Mint(spl_token_2022::state::Mint);

impl Mint {
    pub const LEN: usize = spl_token_2022::state::Mint::LEN;
}

impl anchor_lang::AccountDeserialize for Mint {
    fn try_deserialize_unchecked(buf: &mut &[u8]) -> anchor_lang::Result<Self> {
        spl_token_2022::state::Mint::unpack(buf)
            .map(Mint)
            .map_err(Into::into)
    }
}

impl anchor_lang::AccountSerialize for Mint {}

impl anchor_lang::Owner for Mint {
    fn owner() -> Pubkey {
        ID
    }
}

impl Deref for Mint {
    type Target = spl_token_2022::state::Mint;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[derive(Clone, Debug, Default, PartialEq)]
pub struct TokenAccount(spl_token_2022::state::Account);

impl TokenAccount {
    pub const LEN: usize = spl_token_2022::state::Account::LEN;
}

impl anchor_lang::AccountDeserialize for TokenAccount {
    fn try_deserialize_unchecked(buf: &mut &[u8]) -> anchor_lang::Result<Self> {
        spl_token_2022::state::Account::unpack(buf)
            .map(TokenAccount)
            .map_err(Into::into)
    }
}

impl anchor_lang::AccountSerialize for TokenAccount {}

impl anchor_lang::Owner for TokenAccount {
    fn owner() -> Pubkey {
        ID
    }
}

impl Deref for TokenAccount {
    type Target = spl_token_2022::state::Account;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
