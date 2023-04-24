use anchor_lang::prelude::*;

pub mod mint;
pub mod print;
pub mod update_metadata;
pub mod sell;

use mint::*;
use print::*;
use update_metadata::*;
use sell::*;


declare_id!("88b6N7f2vXTqYAo3SLQGB2ShM7ctrAoxuFA6XaUwWCAu");


#[program]
pub mod mint_nft {
    use super::*;

    pub fn create_initialize_and_mint(
        ctx: Context<CreateInitMint>
    ) -> Result<()> {
        mint::create_initialize_and_mint(
            ctx
        )
    }

    pub fn mint_nft(
        ctx: Context<MintNFT>, 
        metadata_title: String, 
        metadata_symbol: String, 
        metadata_uri: String,
    ) -> Result<()> {
        mint::mint_nft(
            ctx,
            metadata_title,
            metadata_symbol,
            metadata_uri,
        )
    }

    pub fn print(
        ctx: Context<Print>,
        edition: u64
    ) -> Result<()> {
        print::print(
            ctx,
            edition
        )
    }

    // pub fn update_metadata

    pub fn sell(
        ctx: Context<SellNft>,
        sale_lamports: u64
    ) -> Result<()> {
        sell::sell(
            ctx,
            sale_lamports,
        )
    }
}
