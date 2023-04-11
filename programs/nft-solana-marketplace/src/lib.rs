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

    pub fn create_and_initialize(
        ctx: Context<CreateMintAndATA>
    ) -> Result<()> {
        mint::create_and_initialize(
            ctx
        )
    }

    pub fn mint(
        ctx: Context<MintNFT>, 
        metadata_title: String, 
        metadata_symbol: String, 
        metadata_uri: String,
    ) -> Result<()> {
        mint::mint(
            ctx,
            metadata_title,
            metadata_symbol,
            metadata_uri,
        )
    }

    // pub fn print
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
