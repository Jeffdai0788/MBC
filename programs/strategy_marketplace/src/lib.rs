use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount, Transfer},
};

declare_id!("71sBGrD8VytsD9EUnon83CiCmfHN41LMgoWt975AHewm");

#[program]
pub mod strategy_marketplace {
    use super::*;

    pub fn create_strategy(
        ctx: Context<CreateStrategy>,
        strategy_id: u64,
        strategy_hash: [u8; 32],
        api_id: String,
    ) -> Result<()> {
        let strategy = &mut ctx.accounts.strategy;
        strategy.creator = ctx.accounts.creator.key();
        strategy.strategy_mint = ctx.accounts.strategy_mint.key();
        strategy.payment_mint = ctx.accounts.payment_mint.key();
        strategy.listed = false;
        strategy.list_price = 0;
        strategy.seller = ctx.accounts.creator.key();
        strategy.strategy_hash = strategy_hash;
        strategy.api_id = api_id;
        strategy.last_mid_bps = 0;
        strategy.last_update_ts = 0;
        strategy.bump = ctx.bumps.strategy;
        strategy.strategy_id = strategy_id;

        // Mint exactly 1 NFT to creator_nft_ata
        // Authority is strategy PDA. We must sign with strategy seeds.
        let creator_key = ctx.accounts.creator.key();
        let seeds = &[
            b"strategy",
            creator_key.as_ref(),
            &strategy_id.to_le_bytes(),
            &[ctx.bumps.strategy],
        ];
        let signer = &[&seeds[..]];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.strategy_mint.to_account_info(),
                    to: ctx.accounts.creator_nft_ata.to_account_info(),
                    authority: strategy.to_account_info(),
                },
                signer,
            ),
            1,
        )?;

        Ok(())
    }

    pub fn list_strategy(ctx: Context<ListStrategy>, list_price: u64) -> Result<()> {
        let strategy = &mut ctx.accounts.strategy;

        // Require that seller_nft_ata.amount == 1
        require!(ctx.accounts.seller_nft_ata.amount == 1, ErrorCode::NotNftHolder);

        // Transfer 1 NFT from seller_nft_ata to escrow_nft_ata
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.seller_nft_ata.to_account_info(),
                    to: ctx.accounts.escrow_nft_ata.to_account_info(),
                    authority: ctx.accounts.seller.to_account_info(),
                },
            ),
            1,
        )?;

        strategy.listed = true;
        strategy.list_price = list_price;
        strategy.seller = ctx.accounts.seller.key();

        Ok(())
    }

    pub fn buy_strategy(ctx: Context<BuyStrategy>) -> Result<()> {
        let strategy = &mut ctx.accounts.strategy;

        require!(strategy.listed, ErrorCode::StrategyNotListed);

        // Transfer payment from buyer to seller
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.buyer_payment_ata.to_account_info(),
                    to: ctx.accounts.seller_payment_ata.to_account_info(),
                    authority: ctx.accounts.buyer.to_account_info(),
                },
            ),
            strategy.list_price,
        )?;

        // Transfer NFT from escrow to buyer
        let creator_key = strategy.creator;
        let strategy_id = strategy.strategy_id;
        let seeds = &[
            b"strategy",
            creator_key.as_ref(),
            &strategy_id.to_le_bytes(),
            &[strategy.bump],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_nft_ata.to_account_info(),
                    to: ctx.accounts.buyer_nft_ata.to_account_info(),
                    authority: strategy.to_account_info(),
                },
                signer,
            ),
            1,
        )?;

        strategy.listed = false;
        strategy.list_price = 0;
        strategy.seller = ctx.accounts.buyer.key();

        Ok(())
    }

    pub fn update_oracle(ctx: Context<UpdateOracle>, mid_bps: u32, timestamp: i64) -> Result<()> {
        let strategy = &mut ctx.accounts.strategy;
        strategy.last_mid_bps = mid_bps;
        strategy.last_update_ts = timestamp;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(strategy_id: u64)]
pub struct CreateStrategy<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        init,
        seeds = [b"strategy", creator.key().as_ref(), &strategy_id.to_le_bytes()],
        bump,
        payer = creator,
        space = 8 + 32 + 32 + 32 + 1 + 8 + 32 + 32 + (4 + 32) + 4 + 8 + 1 + 8
    )]
    pub strategy: Account<'info, Strategy>,
    #[account(
        init,
        seeds = [b"strategy_mint", strategy.key().as_ref()],
        bump,
        payer = creator,
        mint::decimals = 0,
        mint::authority = strategy,
        mint::freeze_authority = strategy,
    )]
    pub strategy_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = creator,
        associated_token::mint = strategy_mint,
        associated_token::authority = creator,
    )]
    pub creator_nft_ata: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = creator,
        associated_token::mint = strategy_mint,
        associated_token::authority = strategy,
    )]
    pub escrow_nft_ata: Account<'info, TokenAccount>,
    pub payment_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(list_price: u64)]
pub struct ListStrategy<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(
        mut,
        has_one = strategy_mint,
        constraint = strategy.seller == seller.key() @ ErrorCode::NotNftHolder
    )]
    pub strategy: Account<'info, Strategy>,
    pub strategy_mint: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = strategy_mint,
        associated_token::authority = seller,
    )]
    pub seller_nft_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = strategy_mint,
        associated_token::authority = strategy,
    )]
    pub escrow_nft_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyStrategy<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        mut,
        has_one = strategy_mint,
        has_one = payment_mint,
    )]
    pub strategy: Account<'info, Strategy>,
    pub strategy_mint: Account<'info, Mint>,
    pub payment_mint: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = payment_mint,
        associated_token::authority = buyer,
    )]
    pub buyer_payment_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = payment_mint,
        associated_token::authority = strategy.seller,
    )]
    pub seller_payment_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = strategy_mint,
        associated_token::authority = strategy,
    )]
    pub escrow_nft_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = strategy_mint,
        associated_token::authority = buyer,
    )]
    pub buyer_nft_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(mid_bps: u32, timestamp: i64)]
pub struct UpdateOracle<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub strategy: Account<'info, Strategy>,
}

#[account]
pub struct Strategy {
    pub creator: Pubkey,
    pub strategy_mint: Pubkey,
    pub payment_mint: Pubkey,
    pub listed: bool,
    pub list_price: u64,
    pub seller: Pubkey,
    pub strategy_hash: [u8; 32],
    pub api_id: String,
    pub last_mid_bps: u32,
    pub last_update_ts: i64,
    pub bump: u8,
    pub strategy_id: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("User does not hold the NFT")]
    NotNftHolder,
    #[msg("Strategy is not listed for sale")]
    StrategyNotListed,
    #[msg("Insufficient payment balance")]
    InsufficientPaymentBalance,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("NFT Transfer failed")]
    NftTransferFailed,
}
