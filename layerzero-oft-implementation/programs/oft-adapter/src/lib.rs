use anchor_lang::prelude::*;

declare_id!("ARzZEdqRNG9mjBNWrc1rqn6N7CuBfuabUSSmZbGNjSSt");

#[program]
pub mod oft_adapter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, admin: Pubkey) -> Result<()> {
        let store = &mut ctx.accounts.store;
        store.admin = admin;
        Ok(())
    }

    pub fn lock_tokens(_ctx: Context<LockTokens>, _amount: u64) -> Result<()> {
        // TODO: Implement escrow transfer logic (SPL token transfer to escrow account)
        Ok(())
    }
}

#[account]
pub struct Store {
    pub admin: Pubkey,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = payer, space = 8 + 32)]
    pub store: Account<'info, Store>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LockTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
